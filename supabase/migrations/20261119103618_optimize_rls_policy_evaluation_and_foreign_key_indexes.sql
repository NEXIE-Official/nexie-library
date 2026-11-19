do $$
declare
  p record;
  new_qual text;
  new_check text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_qual := p.qual;
    new_check := p.with_check;

    if new_qual is not null then
      new_qual := replace(new_qual, 'auth.uid()', '(select auth.uid())');
      new_qual := replace(new_qual, 'private.is_primary_admin()', '(select private.is_primary_admin())');
      new_qual := replace(new_qual, 'private.is_active_employee()', '(select private.is_active_employee())');
      new_qual := replace(new_qual, 'private.has_completed_initial_password_update()', '(select private.has_completed_initial_password_update())');
    end if;

    if new_check is not null then
      new_check := replace(new_check, 'auth.uid()', '(select auth.uid())');
      new_check := replace(new_check, 'private.is_primary_admin()', '(select private.is_primary_admin())');
      new_check := replace(new_check, 'private.is_active_employee()', '(select private.is_active_employee())');
      new_check := replace(new_check, 'private.has_completed_initial_password_update()', '(select private.has_completed_initial_password_update())');
    end if;

    if new_qual is distinct from p.qual or new_check is distinct from p.with_check then
      if new_qual is not null and new_check is not null then
        execute format('alter policy %I on %I.%I using (%s) with check (%s)',
          p.policyname, p.schemaname, p.tablename, new_qual, new_check);
      elsif new_qual is not null then
        execute format('alter policy %I on %I.%I using (%s)',
          p.policyname, p.schemaname, p.tablename, new_qual);
      elsif new_check is not null then
        execute format('alter policy %I on %I.%I with check (%s)',
          p.policyname, p.schemaname, p.tablename, new_check);
      end if;
    end if;
  end loop;
end $$;

create index if not exists audit_events_actor_idx on public.audit_events(actor_id);
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists support_tickets_assigned_idx on public.support_tickets(assigned_to);
create index if not exists tasks_assigned_by_idx on public.tasks(assigned_by);
create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists teams_created_by_idx on public.teams(created_by);
create index if not exists ticket_messages_sender_idx on public.ticket_messages(sender_id);
