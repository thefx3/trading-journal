alter table public.profiles
  add column theme text not null default 'dark'
  check (theme in ('light', 'dark', 'system'));

