-- Private project asset storage and collaborator read access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nexie-library-assets','nexie-library-assets',false,52428800,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set public=false, file_size_limit=52428800;

drop policy if exists "Nexie project members read assets" on storage.objects;
create policy "Nexie project members read assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'nexie-library-assets'
  and exists (
    select 1 from public.projects p
    where p.id::text = split_part(name,'/',1)
      and (
        p.created_by = (select auth.uid())
        or p.owner_id = (select auth.uid())
        or (select auth.uid()) = any(p.collaborator_ids)
        or (select private.is_primary_admin())
        or exists(select 1 from public.tasks t where t.project_id=p.id and t.assignee_id=(select auth.uid()))
      )
  )
);

drop policy if exists "Nexie project members upload assets" on storage.objects;
create policy "Nexie project members upload assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'nexie-library-assets'
  and exists (
    select 1 from public.projects p
    where p.id::text = split_part(name,'/',1)
      and (
        p.created_by = (select auth.uid())
        or p.owner_id = (select auth.uid())
        or (select auth.uid()) = any(p.collaborator_ids)
        or (select private.is_primary_admin())
        or exists(select 1 from public.tasks t where t.project_id=p.id and t.assignee_id=(select auth.uid()))
      )
  )
);

drop policy if exists "Nexie project members delete assets" on storage.objects;
create policy "Nexie project members delete assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'nexie-library-assets'
  and exists (
    select 1 from public.projects p
    where p.id::text = split_part(name,'/',1)
      and (
        p.created_by = (select auth.uid())
        or p.owner_id = (select auth.uid())
        or (select private.is_primary_admin())
      )
  )
);

drop policy if exists "task assignees read linked projects" on public.projects;
create policy "task assignees read linked projects"
on public.projects for select to authenticated
using (exists (
  select 1 from public.tasks t
  where t.project_id = projects.id
    and t.assignee_id = (select auth.uid())
));
