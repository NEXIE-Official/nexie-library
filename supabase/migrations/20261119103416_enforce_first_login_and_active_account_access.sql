create or replace function private.is_active_employee()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.employee_profiles p
    where p.id = auth.uid()
      and p.account_status = 'active'
      and p.must_change_password = false
  );
$$;

revoke all on function private.is_active_employee() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_active_employee() to authenticated;

create policy "workspace requires active employee and changed password"
on public.teams as restrictive
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());

create policy "workspace requires active employee and changed password"
on public.team_members as restrictive
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());

create policy "workspace requires active employee and changed password"
on public.projects as restrictive
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());

create policy "workspace requires active employee and changed password"
on public.tasks as restrictive
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());

create policy "workspace requires active employee and changed password"
on public.support_tickets as restrictive
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());

create policy "workspace requires active employee and changed password"
on public.ticket_messages as restrictive
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());

create policy "workspace requires active employee and changed password"
on public.audit_events as restrictive
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());
