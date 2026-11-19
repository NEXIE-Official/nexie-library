alter table public.employee_profiles add column if not exists avatar_path text;

drop policy if exists "employees create their own teams" on public.teams;
drop policy if exists "team creators delete their teams" on public.teams;
drop policy if exists "team creators update their teams" on public.teams;
drop policy if exists "team creators manage memberships" on public.team_members;

drop policy if exists "active employees read all team memberships" on public.team_members;
create policy "active employees read all team memberships"
on public.team_members for select to authenticated
using ((select private.is_active_employee()));

drop policy if exists "active employees read employee badge photos" on storage.objects;
create policy "active employees read employee badge photos"
on storage.objects for select to authenticated
using (bucket_id = 'nexie-library-assets' and (storage.foldername(name))[2] = 'employee-badges' and (select private.is_active_employee()));

drop policy if exists "primary admin uploads employee badge photos" on storage.objects;
create policy "primary admin uploads employee badge photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'nexie-library-assets' and (storage.foldername(name))[2] = 'employee-badges' and (select private.is_primary_admin()));

drop policy if exists "primary admin updates employee badge photos" on storage.objects;
create policy "primary admin updates employee badge photos"
on storage.objects for update to authenticated
using (bucket_id = 'nexie-library-assets' and (storage.foldername(name))[2] = 'employee-badges' and (select private.is_primary_admin()))
with check (bucket_id = 'nexie-library-assets' and (storage.foldername(name))[2] = 'employee-badges' and (select private.is_primary_admin()));

drop policy if exists "primary admin deletes employee badge photos" on storage.objects;
create policy "primary admin deletes employee badge photos"
on storage.objects for delete to authenticated
using (bucket_id = 'nexie-library-assets' and (storage.foldername(name))[2] = 'employee-badges' and (select private.is_primary_admin()));

grant update (avatar_path) on public.employee_profiles to authenticated;

create or replace function private.guard_employee_avatar_path()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.avatar_path is distinct from old.avatar_path and not (select private.is_primary_admin()) then
    raise exception 'Only the primary administrator can change employee badge photos';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_employee_avatar_path on public.employee_profiles;
create trigger guard_employee_avatar_path before update of avatar_path on public.employee_profiles
for each row execute function private.guard_employee_avatar_path();

insert into public.teams (name, description, created_by)
select ep.department, 'Official department of N·EXIE / Gatherverse.', '3424810e-b872-43b2-98c7-803e33e671ec'::uuid
from public.employee_profiles ep
where ep.email <> 'admin@nexielibrary.com' and ep.account_status='active'
group by ep.department
on conflict (name) do nothing;

insert into public.team_members (team_id, employee_id, team_role)
select t.id, ep.id, 'member'
from public.teams t join public.employee_profiles ep on ep.department=t.name
where ep.email <> 'admin@nexielibrary.com' and ep.account_status='active'
on conflict (team_id, employee_id) do nothing;