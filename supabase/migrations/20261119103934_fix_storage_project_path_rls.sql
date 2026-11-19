alter policy "active employees upload project assets"
on storage.objects
with check (
  bucket_id = 'nexie-library-assets'
  and (select private.is_active_employee())
  and exists (
    select 1
    from public.projects p
    where p.id = (storage.foldername(storage.objects.name))[1]::uuid
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

alter policy "project participants read project assets"
on storage.objects
using (
  bucket_id = 'nexie-library-assets'
  and (select private.is_active_employee())
  and exists (
    select 1
    from public.projects p
    where p.id = (storage.foldername(storage.objects.name))[1]::uuid
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
