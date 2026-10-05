-- Run once in Supabase SQL Editor (existing databases). Enables saved card order on the pipeline.

alter table public.clients add column if not exists position integer not null default 0;

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
