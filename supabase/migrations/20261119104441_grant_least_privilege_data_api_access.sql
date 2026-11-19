grant usage on schema public to authenticated, service_role;

grant select on table public.employee_profiles to authenticated;
grant update (must_change_password) on table public.employee_profiles to authenticated;

grant select, insert, update, delete on table public.teams to authenticated;
grant select, insert, update, delete on table public.team_members to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.support_tickets to authenticated;
grant select, insert on table public.ticket_messages to authenticated;
grant select on table public.audit_events to authenticated;

grant all privileges on all tables in schema public to service_role;
