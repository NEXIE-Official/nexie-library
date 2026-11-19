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

  update public.employee_profiles
  set must_change_password = false,
      updated_at = now()
  where id = auth.uid()
    and must_change_password = true;

  if not found then
    raise exception 'No pending first-login password change';
  end if;
end;
$$;

revoke all on function public.complete_first_login_password_change() from public, anon;
grant execute on function public.complete_first_login_password_change() to authenticated;
