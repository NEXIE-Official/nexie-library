create schema if not exists private;
create table if not exists private.system_administrators (
  user_id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique,
  admin_level text not null check (admin_level = 'primary_admin'),
  created_at timestamptz not null default now()
);
alter table private.system_administrators enable row level security;
revoke all on schema private from public, anon, authenticated;
revoke all on table private.system_administrators from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on table private.system_administrators to service_role;
do $$
declare admin_user_id uuid;
begin
  select id into admin_user_id from auth.users where lower(email)=lower('admin@nexielibrary.com');
  if admin_user_id is null then
    raise exception 'Create and confirm admin@nexielibrary.com in Supabase Auth before applying this migration';
  end if;
  insert into private.system_administrators(user_id,email,admin_level)
  values(admin_user_id,'admin@nexielibrary.com','primary_admin')
  on conflict(user_id) do update set email=excluded.email, admin_level=excluded.admin_level;
end $$;
