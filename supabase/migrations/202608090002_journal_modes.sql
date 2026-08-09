create type public.journal_mode as enum ('live', 'study', 'replay');

alter table public.trades
  add column journal_mode public.journal_mode not null default 'live',
  add column setup_found boolean not null default true,
  alter column entry_at drop not null,
  alter column direction drop not null,
  alter column planned_rr drop not null,
  alter column result drop not null,
  alter column realized_r drop not null;

alter table public.trades add constraint trades_mode_fields_check check (
  journal_mode = 'study'
  or (
    entry_at is not null
    and direction is not null
    and planned_rr is not null
    and result is not null
    and realized_r is not null
  )
);

alter table public.trades add constraint trades_study_setup_check check (
  journal_mode <> 'study'
  or setup_found
  or (
    direction is null
    and planned_rr is null
    and result is null
    and realized_r is null
  )
);

create index trades_user_mode_date_idx on public.trades(user_id, journal_mode, trade_date desc);

comment on column public.trades.journal_mode is 'live: real execution, study: retrospective analysis, replay: simulated execution without future knowledge';
comment on column public.trades.setup_found is 'Relevant to study entries; false means no valid setup was identified';
