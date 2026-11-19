create policy "employees create their own teams"
on public.teams
for insert
to authenticated
with check (created_by = auth.uid());

create policy "team creators update their teams"
on public.teams
for update
to authenticated
using (created_by = auth.uid() or private.is_primary_admin())
with check (created_by = auth.uid() or private.is_primary_admin());

create policy "team creators delete their teams"
on public.teams
for delete
to authenticated
using (created_by = auth.uid() or private.is_primary_admin());

create policy "members and team creators read memberships"
on public.team_members
for select
to authenticated
using (
  employee_id = auth.uid()
  or exists (
    select 1 from public.teams t
    where t.id = team_id and t.created_by = auth.uid()
  )
  or private.is_primary_admin()
);

create policy "team creators manage memberships"
on public.team_members
for all
to authenticated
using (
  exists (
    select 1 from public.teams t
    where t.id = team_id and t.created_by = auth.uid()
  )
  or private.is_primary_admin()
)
with check (
  exists (
    select 1 from public.teams t
    where t.id = team_id and t.created_by = auth.uid()
  )
  or private.is_primary_admin()
);

create index team_members_employee_idx on public.team_members(employee_id);
