alter table public.profiles
  add column pinned_instrument_groups text[] not null default array['NQ', 'ES', 'YM'],
  add column time_format text not null default '24h' check (time_format in ('12h', '24h')),
  add column show_seconds boolean not null default true;

insert into public.instruments (symbol, display_name, asset_class, exchange, market_timezone) values
  ('GC', 'Gold Futures', 'commodity_future', 'COMEX', 'America/New_York'),
  ('MGC', 'Micro Gold Futures', 'commodity_future', 'COMEX', 'America/New_York'),
  ('CL', 'Crude Oil Futures', 'commodity_future', 'NYMEX', 'America/New_York'),
  ('MCL', 'Micro Crude Oil Futures', 'commodity_future', 'NYMEX', 'America/New_York'),
  ('SI', 'Silver Futures', 'commodity_future', 'COMEX', 'America/New_York'),
  ('SIL', 'Micro Silver Futures', 'commodity_future', 'COMEX', 'America/New_York')
on conflict (symbol) do update set
  display_name = excluded.display_name,
  asset_class = excluded.asset_class,
  exchange = excluded.exchange,
  market_timezone = excluded.market_timezone,
  active = true;

