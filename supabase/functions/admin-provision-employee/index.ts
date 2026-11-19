import { createClient } from "npm:@supabase/supabase-js@2.119.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token === authHeader) return reply(401, { error: "Authentication required" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return reply(500, { error: "Server configuration incomplete" });

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return reply(401, { error: "Invalid session" });

  const primaryAdminId = "3424810e-b872-43b2-98c7-803e33e671ec";
  if (
    authData.user.id !== primaryAdminId ||
    (authData.user.email ?? "").toLowerCase() !== "admin@nexielibrary.com"
  ) {
    return reply(403, { error: "Only the primary administrator can create accounts" });
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON body" });
  }

  const email = String(input.email ?? "").trim().toLowerCase();
  const fullName = String(input.full_name ?? "").trim();
  const jobTitle = String(input.job_title ?? "").trim();
  const department = String(input.department ?? "").trim();
  const password = String(input.initial_password ?? "");

  const allowedDomains = ["nexielibrary.com", "gatherverse.com"];
  const domain = email.split("@")[1] ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowedDomains.includes(domain)) {
    return reply(400, { error: "Use an authorized N·EXIE or Gatherverse work email" });
  }
  if (!fullName || !jobTitle || !department) {
    return reply(400, { error: "Name, job title, and department are required" });
  }
  if (password.length < 12) {
    return reply(400, { error: "Initial password must contain at least 12 characters" });
  }
  if (email === "admin@nexielibrary.com") {
    return reply(409, { error: "The primary administrator account is reserved" });
  }

  const { data: existingProfile, error: profileLookupError } = await admin
    .from("employee_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileLookupError) return reply(500, { error: "Could not verify existing account" });
  if (existingProfile) return reply(409, { error: "An employee profile already exists for this email" });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return reply(400, { error: createError?.message ?? "Could not create authentication user" });
  }

  const userId = created.user.id;
  const { error: insertError } = await admin.from("employee_profiles").insert({
    id: userId,
    email,
    full_name: fullName,
    job_title: jobTitle,
    department,
    account_status: "active",
    must_change_password: false,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(userId);
    return reply(500, { error: "Profile creation failed; the new login was rolled back" });
  }

  await admin.from("audit_events").insert({
    actor_id: authData.user.id,
    action: "employee_account_created",
    entity_type: "employee_profile",
    entity_id: userId,
    details: { email, full_name: fullName, job_title: jobTitle, department },
  });

  return reply(201, {
    user_id: userId,
    email,
    account_status: "active",
    must_change_password: false,
    message: "Account created. Deliver the initial password through a private channel.",
  });
});
