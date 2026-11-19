revoke update on table public.employee_profiles from anon, authenticated;
revoke update on table public.employee_profiles from public;
grant update (must_change_password) on table public.employee_profiles to authenticated;
