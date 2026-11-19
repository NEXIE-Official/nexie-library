-- Publish task assignments to Supabase Realtime so the assigned employee
-- receives an in-app notification while the workspace is open.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;
