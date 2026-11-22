-- Risknote now journals executed trades only. Historical missed opportunities
-- remain untouched for data safety, but all new and updated rows must be taken.

alter table public.trades
  alter column trade_status set default 'taken'::public.trade_status;

alter table public.trades
  add constraint trades_recorded_status_check
  check (trade_status is null or trade_status = 'taken') not valid;

comment on column public.trades.trade_status is
  'Legacy compatibility field. Risknote records taken trades only.';

comment on column public.trades.realized_r is
  'Realized outcome in R for a recorded trade.';
