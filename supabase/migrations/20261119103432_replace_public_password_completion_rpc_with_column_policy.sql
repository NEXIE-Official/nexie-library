create or replace function private.has_completed_initial_password_update()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.employee_profiles p on p.id = u.id
    where u.id = auth.uid()
      and p.must_change_password = true
      and u.updated_at > p.updated_at
  );
$$;

revoke all on function private.has_completed_initial_password_update() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_completed_initial_password_update() to authenticated;

grant update (must_change_password) on public.employee_profiles to authenticated;

create policy "employee completes first login after changing password"
on public.employee_profiles
for update
to authenticated
using (
  id = auth.uid()
  and must_change_password = true
  and private.has_completed_initial_password_update()
)
with check (
  id = auth.uid()
  and must_change_password = false
);

drop function public.complete_first_login_password_change();
