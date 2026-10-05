-- PulseCRM schema. Run once in Supabase Dashboard -> SQL Editor.
-- Multi-tenant: every row belongs to a workspace; RLS limits access to members.

create extension if not exists "pgcrypto";

-- ---------- Tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  accent text not null default 'indigo' check (accent in ('indigo', 'emerald', 'rose', 'amber', 'sky', 'violet')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on public.workspace_members (user_id);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Proposal Sent', 'Won', 'Lost')),
  value numeric(12, 2) not null default 0,
  position integer not null default 0,
  owner_id uuid references auth.users(id),
  last_contact timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.clients (workspace_id, status);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null default 'Note' check (type in ('Call', 'Email', 'Meeting', 'Note')),
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.activities (client_id, created_at desc);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token uuid not null default gen_random_uuid(),
  invited_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

-- ---------- Helpers (security definer avoids RLS recursion) ----------
create or replace function public.is_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspace_members where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.has_role(ws uuid, roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws and user_id = auth.uid() and role = any(roles)
  );
$$;

-- ---------- Triggers ----------

-- Reordering cards must not touch updated_at (the dashboard's revenue trend uses it).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'position' - 'updated_at') is distinct from (to_jsonb(old) - 'position' - 'updated_at') then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$$;

create trigger clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();

-- Never trust owner/workspace from the client on update.
create or replace function public.lock_client_scope()
returns trigger language plpgsql as $$
begin new.workspace_id = old.workspace_id; return new; end;
$$;
create trigger clients_lock before update on public.clients
  for each row execute function public.lock_client_scope();

-- Plan limit: free workspaces can hold 25 clients.
create or replace function public.enforce_plan_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text; n int;
begin
  select plan into p from workspaces where id = new.workspace_id;
  if p = 'free' then
    select count(*) into n from clients where workspace_id = new.workspace_id;
    if n >= 25 then
      raise exception 'PLAN_LIMIT: Free plan allows 25 clients. Upgrade to Pro.';
    end if;
  end if;
  return new;
end;
$$;
create trigger clients_plan_limit before insert on public.clients
  for each row execute function public.enforce_plan_limit();

-- New user -> profile + personal workspace (as owner). Pending invites are accepted in-app.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ws uuid; nm text;
begin
  nm := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  insert into profiles (id, full_name, email) values (new.id, nm, new.email);
  insert into workspaces (name, created_by) values (nm || '''s Workspace', new.id)
    returning id into ws;
  insert into workspace_members (workspace_id, user_id, role) values (ws, new.id, 'owner');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accept an invite by token (called by the invited, signed-in user).
create or replace function public.accept_invite(invite_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invites; em text;
begin
  select email into em from auth.users where id = auth.uid();
  select * into inv from invites
    where token = invite_token and accepted_at is null and lower(email) = lower(em);
  if not found then raise exception 'Invite not found for this account'; end if;
  insert into workspace_members (workspace_id, user_id, role)
    values (inv.workspace_id, auth.uid(), inv.role)
    on conflict do nothing;
  update invites set accepted_at = now() where id = inv.id;
  return inv.workspace_id;
end;
$$;

-- ---------- Row level security ----------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.activities enable row level security;
alter table public.invites enable row level security;

create policy "profiles read own or teammates" on public.profiles for select
  using (id = auth.uid() or exists (
    select 1 from workspace_members a join workspace_members b
      on a.workspace_id = b.workspace_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy "profiles update own" on public.profiles for update
  using (id = auth.uid());

create policy "workspaces read" on public.workspaces for select
  using (public.is_member(id));
create policy "workspaces update admin" on public.workspaces for update
  using (public.has_role(id, array['owner', 'admin']));

create policy "members read" on public.workspace_members for select
  using (public.is_member(workspace_id));
create policy "members manage" on public.workspace_members for delete
  using (public.has_role(workspace_id, array['owner', 'admin']) and role <> 'owner');
create policy "members change role" on public.workspace_members for update
  using (public.has_role(workspace_id, array['owner']) and role <> 'owner');

create policy "clients read" on public.clients for select
  using (public.is_member(workspace_id));
create policy "clients insert" on public.clients for insert
  with check (public.is_member(workspace_id));
create policy "clients update" on public.clients for update
  using (public.is_member(workspace_id));
create policy "clients delete" on public.clients for delete
  using (public.has_role(workspace_id, array['owner', 'admin']));

create policy "activities read" on public.activities for select
  using (public.is_member(workspace_id));
create policy "activities insert" on public.activities for insert
  with check (public.is_member(workspace_id) and created_by = auth.uid());
create policy "activities delete" on public.activities for delete
  using (created_by = auth.uid() or public.has_role(workspace_id, array['owner', 'admin']));

create policy "invites read" on public.invites for select
  using (public.has_role(workspace_id, array['owner', 'admin']));
create policy "invites create" on public.invites for insert
  with check (public.has_role(workspace_id, array['owner', 'admin']) and invited_by = auth.uid());
create policy "invites delete" on public.invites for delete
  using (public.has_role(workspace_id, array['owner', 'admin']));
