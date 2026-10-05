-- Run once in Supabase SQL Editor (after 001). Adds profile email and a per-workspace accent colour.

alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

alter table public.workspaces add column if not exists accent text not null default 'indigo'
  check (accent in ('indigo', 'emerald', 'rose', 'amber', 'sky', 'violet'));

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
