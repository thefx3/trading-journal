create table public.setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.trades add column setup_id uuid references public.setups(id) on delete set null;
alter table public.profiles add column default_setup_id uuid references public.setups(id) on delete set null;
create index setups_user_active_idx on public.setups(user_id, archived_at, name);
create index trades_setup_date_idx on public.trades(setup_id, trade_date desc);
create trigger setups_updated_at before update on public.setups for each row execute function public.set_updated_at();

alter table public.setups enable row level security;
create policy "setups_select_own" on public.setups for select to authenticated using ((select auth.uid()) = user_id);
create policy "setups_insert_own" on public.setups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "setups_update_own" on public.setups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

comment on table public.setups is 'Reusable trading frameworks. archived_at hides a setup from new trades while preserving history.';
