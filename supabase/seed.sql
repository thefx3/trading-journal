insert into public.instruments (symbol, display_name, asset_class, exchange, market_timezone) values
('NQ', 'E-mini Nasdaq-100', 'index_future', 'CME', 'America/New_York'), ('MNQ', 'Micro E-mini Nasdaq-100', 'index_future', 'CME', 'America/New_York'),
('ES', 'E-mini S&P 500', 'index_future', 'CME', 'America/New_York'), ('MES', 'Micro E-mini S&P 500', 'index_future', 'CME', 'America/New_York'),
('YM', 'E-mini Dow', 'index_future', 'CBOT', 'America/New_York'), ('MYM', 'Micro E-mini Dow', 'index_future', 'CBOT', 'America/New_York'),
('RTY', 'E-mini Russell 2000', 'index_future', 'CME', 'America/New_York'), ('M2K', 'Micro E-mini Russell 2000', 'index_future', 'CME', 'America/New_York'),
('BTC', 'Bitcoin', 'crypto', null, 'UTC'), ('ETH', 'Ethereum', 'crypto', null, 'UTC'),
('EURUSD', 'Euro / US Dollar', 'forex', null, 'UTC'), ('GBPUSD', 'British Pound / US Dollar', 'forex', null, 'UTC'), ('XAUUSD', 'Gold / US Dollar', 'commodity', null, 'UTC'),
('GC', 'Gold Futures', 'commodity_future', 'COMEX', 'America/New_York'), ('MGC', 'Micro Gold Futures', 'commodity_future', 'COMEX', 'America/New_York'),
('CL', 'Crude Oil Futures', 'commodity_future', 'NYMEX', 'America/New_York'), ('MCL', 'Micro Crude Oil Futures', 'commodity_future', 'NYMEX', 'America/New_York'),
('SI', 'Silver Futures', 'commodity_future', 'COMEX', 'America/New_York'), ('SIL', 'Micro Silver Futures', 'commodity_future', 'COMEX', 'America/New_York')
on conflict (symbol) do update set display_name = excluded.display_name, asset_class = excluded.asset_class, exchange = excluded.exchange, market_timezone = excluded.market_timezone;
