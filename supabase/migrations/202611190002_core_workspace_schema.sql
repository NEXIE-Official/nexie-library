create type public.account_status as enum ('active','suspended','pending');
create type public.project_status as enum ('draft','active','review','completed','archived');
create type public.task_status as enum ('assigned','in_progress','submitted','revision','approved','cancelled');
create type public.ticket_status as enum ('open','triaged','in_progress','waiting','resolved','closed');

create or replace function private.is_primary_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.system_administrators a where a.user_id = auth.uid() and a.admin_level = 'primary_admin') $$;
revoke all on function private.is_primary_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_primary_admin() to authenticated;

create table public.employee_profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 email text not null unique,
 full_name text not null,
 job_title text not null,
 department text not null,
 account_status public.account_status not null default 'pending',
 must_change_password boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.teams (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 description text not null default '',
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table public.team_members (
 team_id uuid not null references public.teams(id) on delete cascade,
 employee_id uuid not null references public.employee_profiles(id) on delete cascade,
 team_role text not null default 'member',
 added_at timestamptz not null default now(),
 primary key(team_id, employee_id)
);
create table public.projects (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 library text not null,
 collection text,
 folder_name text,
 brief text not null default '',
 created_by uuid not null references public.employee_profiles(id),
 owner_id uuid not null references public.employee_profiles(id),
 status public.project_status not null default 'draft',
 due_date date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.tasks (
 id uuid primary key default gen_random_uuid(),
 project_id uuid references public.projects(id) on delete set null,
 title text not null,
 instructions text not null default '',
 assigned_by uuid not null references public.employee_profiles(id),
 assignee_id uuid not null references public.employee_profiles(id),
 status public.task_status not null default 'assigned',
 due_date date,
 submitted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.employee_profiles(id),
 subject text not null,
 category text not null,
 message text not null,
 assigned_to uuid references public.employee_profiles(id),
 status public.ticket_status not null default 'open',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.ticket_messages (
 id uuid primary key default gen_random_uuid(),
 ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 sender_id uuid not null references public.employee_profiles(id),
 message text not null,
 created_at timestamptz not null default now()
);
create table public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 action text not null,
 entity_type text not null,
 entity_id text,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index projects_owner_idx on public.projects(owner_id, status);
create index tasks_assignee_idx on public.tasks(assignee_id, status, due_date);
create index tickets_requester_idx on public.support_tickets(requester_id, status);
create index ticket_messages_ticket_idx on public.ticket_messages(ticket_id, created_at);
create index audit_events_created_idx on public.audit_events(created_at desc);

alter table public.employee_profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.audit_events enable row level security;

grant select on public.employee_profiles, public.teams, public.team_members, public.projects, public.tasks, public.support_tickets, public.ticket_messages to authenticated;
grant insert, update, delete on public.teams, public.team_members, public.projects, public.tasks, public.support_tickets, public.ticket_messages to authenticated;
grant select on public.audit_events to authenticated;

create policy "employees read own profile or admin reads all" on public.employee_profiles for select to authenticated using (id=auth.uid() or private.is_primary_admin());
create policy "only primary admin manages employee profiles" on public.employee_profiles for all to authenticated using (private.is_primary_admin()) with check (private.is_primary_admin());
create policy "authenticated users read teams" on public.teams for select to authenticated using (true);
create policy "only primary admin manages teams" on public.teams for all to authenticated using (private.is_primary_admin()) with check (private.is_primary_admin());
create policy "members read own team memberships or admin" on public.team_members for select to authenticated using (employee_id=auth.uid() or private.is_primary_admin());
create policy "only primary admin manages team memberships" on public.team_members for all to authenticated using (private.is_primary_admin()) with check (private.is_primary_admin());
create policy "project owners and assignees or admin read projects" on public.projects for select to authenticated using (created_by=auth.uid() or owner_id=auth.uid() or private.is_primary_admin());
create policy "authenticated create projects for self" on public.projects for insert to authenticated with check (created_by=auth.uid() and owner_id=auth.uid());
create policy "owners or admin update projects" on public.projects for update to authenticated using (owner_id=auth.uid() or private.is_primary_admin()) with check (owner_id=auth.uid() or private.is_primary_admin());
create policy "admin deletes projects" on public.projects for delete to authenticated using (private.is_primary_admin());
create policy "task assignee assigner or admin reads tasks" on public.tasks for select to authenticated using (assignee_id=auth.uid() or assigned_by=auth.uid() or private.is_primary_admin());
create policy "employees create tasks for self only" on public.tasks for insert to authenticated with check (assigned_by=auth.uid() and assignee_id=auth.uid());
create policy "assignee submits task or admin manages" on public.tasks for update to authenticated using (assignee_id=auth.uid() or private.is_primary_admin()) with check (assignee_id=auth.uid() or private.is_primary_admin());
create policy "admin deletes tasks" on public.tasks for delete to authenticated using (private.is_primary_admin());
create policy "requester or admin reads tickets" on public.support_tickets for select to authenticated using (requester_id=auth.uid() or private.is_primary_admin());
create policy "employees open own tickets" on public.support_tickets for insert to authenticated with check (requester_id=auth.uid());
create policy "admin manages tickets" on public.support_tickets for update to authenticated using (private.is_primary_admin()) with check (private.is_primary_admin());
create policy "ticket participants read messages" on public.ticket_messages for select to authenticated using (exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.requester_id=auth.uid() or private.is_primary_admin())));
create policy "requester adds own ticket messages" on public.ticket_messages for insert to authenticated with check (sender_id=auth.uid() and exists(select 1 from public.support_tickets t where t.id=ticket_id and t.requester_id=auth.uid()));
create policy "admin reads audit log" on public.audit_events for select to authenticated using (private.is_primary_admin());
