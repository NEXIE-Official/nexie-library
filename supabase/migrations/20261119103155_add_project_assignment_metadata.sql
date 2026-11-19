alter table public.projects
  add column target_team text,
  add column collaborator_ids uuid[] not null default '{}',
  add column is_single_person boolean not null default true;

create policy "project collaborators read shared projects"
on public.projects
for select
to authenticated
using (auth.uid() = any(collaborator_ids));
