insert into storage.buckets (id, name, public, file_size_limit)
values ('nexie-library-assets', 'nexie-library-assets', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create policy "active employees upload project assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'nexie-library-assets'
  and (select private.is_active_employee())
  and exists (
    select 1
    from public.projects p
    where p.id = (storage.foldername(name))[1]::uuid
      and (
        p.created_by = (select auth.uid())
        or p.owner_id = (select auth.uid())
        or (select auth.uid()) = any(p.collaborator_ids)
        or exists (
          select 1 from public.tasks t
          where t.project_id = p.id and t.assignee_id = (select auth.uid())
        )
        or (select private.is_primary_admin())
      )
  )
);

create policy "project participants read project assets"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'nexie-library-assets'
  and (select private.is_active_employee())
  and exists (
    select 1
    from public.projects p
    where p.id = (storage.foldername(name))[1]::uuid
      and (
        p.created_by = (select auth.uid())
        or p.owner_id = (select auth.uid())
        or (select auth.uid()) = any(p.collaborator_ids)
        or exists (
          select 1 from public.tasks t
          where t.project_id = p.id and t.assignee_id = (select auth.uid())
        )
        or (select private.is_primary_admin())
      )
  )
);

create policy "project creators and administrators delete assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'nexie-library-assets'
  and (
    owner_id = (select auth.uid())::text
    or (select private.is_primary_admin())
  )
);
