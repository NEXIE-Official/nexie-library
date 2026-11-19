revoke all privileges on table public.employee_profiles from anon, authenticated, public;
grant select on table public.employee_profiles to authenticated;
grant update (must_change_password) on table public.employee_profiles to authenticated;

revoke insert, update, delete on table public.audit_events from anon, authenticated, public;
grant select on table public.audit_events to authenticated;

revoke update, delete on table public.ticket_messages from anon, authenticated, public;
grant select, insert on table public.ticket_messages to authenticated;
