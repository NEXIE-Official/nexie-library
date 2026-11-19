create policy "active employees create projects for active owners"
on public.projects
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.employee_profiles p
    where p.id = owner_id and p.account_status = 'active'
  )
);

create policy "active employees create tasks for active assignees"
on public.tasks
for insert
to authenticated
with check (
  assigned_by = auth.uid()
  and exists (
    select 1 from public.employee_profiles p
    where p.id = assignee_id and p.account_status = 'active'
  )
);

create policy "task assignees read linked projects"
on public.projects
for select
to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.project_id = id and t.assignee_id = auth.uid()
  )
);
