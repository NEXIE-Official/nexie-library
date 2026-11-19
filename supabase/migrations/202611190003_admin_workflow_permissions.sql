create policy "primary admin creates projects for any owner" on public.projects for insert to authenticated with check (private.is_primary_admin());
create policy "primary admin creates tasks for any assignee" on public.tasks for insert to authenticated with check (private.is_primary_admin());
create policy "primary admin creates tickets for staff" on public.support_tickets for insert to authenticated with check (private.is_primary_admin());
create policy "primary admin replies to any ticket" on public.ticket_messages for insert to authenticated with check (private.is_primary_admin());
