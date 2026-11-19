create policy "active employees read active employee directory"
on public.employee_profiles
for select
to authenticated
using (account_status = 'active');
