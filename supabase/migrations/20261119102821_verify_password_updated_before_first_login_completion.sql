create or replace function public.complete_first_login_password_change()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.employee_profiles as p
  set must_change_password = false,
      updated_at = now()
  where p.id = auth.uid()
    and p.must_change_password = true
    and exists (
      select 1
      from auth.users as u
      where u.id = p.id
        and u.updated_at > p.updated_at
    );

  if not found then
    raise exception 'Change the account password before completing first login';
  end if;
end;
$$;

revoke all on function public.complete_first_login_password_change() from public, anon;
grant execute on function public.complete_first_login_password_change() to authenticated;
