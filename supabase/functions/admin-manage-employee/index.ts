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

  if (
    authData.user.id !== "3424810e-b872-43b2-98c7-803e33e671ec" ||
    (authData.user.email ?? "").toLowerCase() !== "admin@nexielibrary.com"
  ) {
    return reply(403, { error: "Only the primary administrator can manage accounts" });
  }

  let input: Record<string, unknown>;
  try { input = await req.json(); } catch { return reply(400, { error: "Invalid JSON body" }); }

  const userId = String(input.user_id ?? "");
  const action = String(input.action ?? "");
  if (!userId || userId === authData.user.id) return reply(400, { error: "Invalid target account" });

  const { data: target, error: targetError } = await admin
    .from("employee_profiles")
    .select("id,email,full_name")
    .eq("id", userId)
    .maybeSingle();
  if (targetError || !target) return reply(404, { error: "Employee account not found" });

  if (action === "reset_password") {
    const password = String(input.initial_password ?? "");
    if (password.length < 12) return reply(400, { error: "Initial password must contain at least 12 characters" });
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return reply(400, { error: error.message });
    const { error: profileError } = await admin
      .from("employee_profiles")
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (profileError) return reply(500, { error: "Password was reset but profile could not be updated" });
  } else if (action === "set_status") {
    const status = String(input.account_status ?? "");
    if (!["active", "suspended"].includes(status)) return reply(400, { error: "Invalid account status" });
    const { error } = await admin.from("employee_profiles").update({ account_status: status }).eq("id", userId);
    if (error) return reply(500, { error: "Could not update account status" });
  } else if (action === "update_role") {
    const jobTitle = String(input.job_title ?? "").trim();
    const department = String(input.department ?? "").trim();
    if (!jobTitle || !department) return reply(400, { error: "Job title and department are required" });
    const { error } = await admin.from("employee_profiles").update({ job_title: jobTitle, department }).eq("id", userId);
    if (error) return reply(500, { error: "Could not update employee role" });
  } else if (action === "set_avatar_path") {
    const avatarPath = String(input.avatar_path ?? "");
    if (!avatarPath.startsWith(`employee-badges/${userId}/badge.`) ||
        !/\\.(jpg|png|webp)$/i.test(avatarPath) ||
        avatarPath.includes("..")) {
      return reply(400, { error: "Invalid employee badge photo path" });
    }
    const { error } = await admin
      .from("employee_profiles")
      .update({ avatar_path: avatarPath, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) return reply(500, { error: "Could not save employee badge photo" });
  } else {
    return reply(400, { error: "Unsupported account action" });
  }

  await admin.from("audit_events").insert({
    actor_id: authData.user.id,
    action: "employee_" + action,
    entity_type: "employee_profile",
    entity_id: userId,
    details: { email: target.email, full_name: target.full_name },
  });

  return reply(200, { success: true, user_id: userId, action });
});
