-- N·EXIE LIBRARY — Supabase/PostgreSQL security foundation
-- Apply only after creating a Supabase project and configuring Auth.
create extension if not exists pgcrypto;

create type public.workspace_role as enum ('member','team_lead','executive','it_admin');
create type public.work_status as enum ('todo','in_progress','review','done');
create type public.work_priority as enum ('normal','medium','high','urgent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  job_title text not null,
  team text not null,
  role public.workspace_role not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 180),
  artist text,
  team text not null,
  created_by uuid not null references public.profiles(id),
  assignee_id uuid references public.profiles(id),
  status public.work_status not null default 'todo',
  priority public.work_priority not null default 'normal',
  due_at date,
  brief text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_comments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id),
  subject text not null check (char_length(subject) between 3 and 180),
  category text not null,
  description text not null check (char_length(description) between 5 and 12000),
  status text not null default 'open' check (status in ('open','triaged','in_progress','resolved','closed')),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index work_items_assignee_idx on public.work_items(assignee_id, status);
create index work_items_team_idx on public.work_items(team, status);
create index direct_messages_pair_idx on public.direct_messages(sender_id, recipient_id, created_at desc);
create index support_tickets_status_idx on public.support_tickets(status, created_at desc);

create function public.current_team() returns text language sql stable security definer set search_path=public as $$
  select team from public.profiles where id=auth.uid() and is_active=true
$$;
create function public.current_role() returns public.workspace_role language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid() and is_active=true
$$;
create function public.is_staff_admin() returns boolean language sql stable security definer set search_path=public as $$
  select coalesce(public.current_role() in ('executive','it_admin'),false)
$$;

alter table public.profiles enable row level security;
alter table public.work_items enable row level security;
alter table public.work_comments enable row level security;
alter table public.direct_messages enable row level security;
alter table public.support_tickets enable row level security;

-- Column-level grants prevent users from escalating their own role/team.
revoke update on public.profiles from authenticated;
grant update(full_name) on public.profiles to authenticated;
-- Recipients may acknowledge a message but cannot rewrite its sender or content.
revoke update on public.direct_messages from authenticated;
grant update(read_at) on public.direct_messages to authenticated;

create policy "profiles visible to authenticated colleagues" on public.profiles
 for select to authenticated using (is_active=true);
create policy "profile self update limited by column grants" on public.profiles
 for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create policy "work visible to owner assignee team or admins" on public.work_items
 for select to authenticated using (
   created_by=auth.uid() or assignee_id=auth.uid()
   or team=public.current_team() or public.is_staff_admin()
 );
create policy "authenticated members create work as themselves" on public.work_items
 for insert to authenticated with check (created_by=auth.uid());
create policy "work updates by creator assignee team lead or admin" on public.work_items
 for update to authenticated using (
   created_by=auth.uid() or assignee_id=auth.uid()
   or (team=public.current_team() and public.current_role() in ('team_lead','executive','it_admin'))
   or public.is_staff_admin()
 ) with check (
   created_by=auth.uid() or assignee_id=auth.uid()
   or (team=public.current_team() and public.current_role() in ('team_lead','executive','it_admin'))
   or public.is_staff_admin()
 );
create policy "work delete by creator or admin" on public.work_items
 for delete to authenticated using (created_by=auth.uid() or public.is_staff_admin());

create policy "comments visible with parent work" on public.work_comments
 for select to authenticated using (exists(select 1 from public.work_items w where w.id=work_item_id));
create policy "comments authored by current user on visible work" on public.work_comments
 for insert to authenticated with check (author_id=auth.uid() and exists(select 1 from public.work_items w where w.id=work_item_id));
create policy "comment author or admin deletes" on public.work_comments
 for delete to authenticated using (author_id=auth.uid() or public.is_staff_admin());

create policy "direct messages only sender recipient" on public.direct_messages
 for select to authenticated using (sender_id=auth.uid() or recipient_id=auth.uid() or public.is_staff_admin());
create policy "send message as self" on public.direct_messages
 for insert to authenticated with check (sender_id=auth.uid() and sender_id<>recipient_id);
create policy "recipient marks message read" on public.direct_messages
 for update to authenticated using (recipient_id=auth.uid()) with check (recipient_id=auth.uid());

create policy "requesters and IT can view tickets" on public.support_tickets
 for select to authenticated using (requester_id=auth.uid() or public.current_team()='Technology' or public.is_staff_admin());
create policy "users open own tickets" on public.support_tickets
 for insert to authenticated with check (requester_id=auth.uid());
create policy "IT updates tickets" on public.support_tickets
 for update to authenticated using (public.current_team()='Technology' or public.is_staff_admin())
 with check (public.current_team()='Technology' or public.is_staff_admin());

-- Never expose the service-role key in the mobile app or browser bundle.
-- Configure MFA for privileged roles, verified email, rate limits, backups and audit logging in the provider dashboard.
