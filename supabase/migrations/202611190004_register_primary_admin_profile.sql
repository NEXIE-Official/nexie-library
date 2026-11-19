insert into public.employee_profiles
  (id, email, full_name, job_title, department, account_status, must_change_password)
select
  u.id,
  u.email,
  'N·EXIE Administrator',
  'Primary Administrator',
  'Executive',
  'active',
  false
from auth.users as u
where lower(u.email) = 'admin@nexielibrary.com'
on conflict (id) do update
set
  email = excluded.email,
  job_title = excluded.job_title,
  department = excluded.department,
  account_status = 'active',
  must_change_password = false,
  updated_at = now();
