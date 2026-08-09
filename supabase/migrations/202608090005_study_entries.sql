create table public.study_entries (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  position integer not null check (position >= 0),
  entry_at timestamptz not null,
  session public.trading_session not null,
  session_override boolean not null default false,
  direction public.trade_direction not null,
  planned_rr numeric(8, 3) not null check (planned_rr > 0),
  result public.trade_result not null,
  realized_r numeric(8, 3) not null check (realized_r between -100 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trade_id, position)
);

create index study_entries_trade_position_idx on public.study_entries(trade_id, position);
create trigger study_entries_updated_at before update on public.study_entries for each row execute function public.set_updated_at();
alter table public.study_entries enable row level security;
create policy "study_entries_select_own" on public.study_entries for select to authenticated using (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid())));
create policy "study_entries_insert_own" on public.study_entries for insert to authenticated with check (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid()) and t.journal_mode = 'study'));
create policy "study_entries_update_own" on public.study_entries for update to authenticated using (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid()))) with check (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid()) and t.journal_mode = 'study'));
create policy "study_entries_delete_own" on public.study_entries for delete to authenticated using (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid())));

comment on table public.study_entries is 'Potential executions identified inside one retrospective Study post. Images and notes remain on the parent trade.';
