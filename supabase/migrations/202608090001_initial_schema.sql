create extension if not exists "pgcrypto";

create type public.trade_direction as enum ('long', 'short');
create type public.trade_result as enum ('win', 'loss', 'be', 'open');
create type public.trade_visibility as enum ('private', 'followers', 'public');
create type public.trading_session as enum ('asia', 'london', 'new_york_am', 'new_york_lunch', 'new_york_pm', 'other');
create type public.trade_image_type as enum ('htf_analysis', 'setup', 'entry', 'management', 'exit', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or length(username) between 3 and 32),
  display_name text,
  avatar_url text,
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  display_name text not null,
  asset_class text not null,
  exchange text,
  market_timezone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  instrument_id uuid not null references public.instruments(id),
  trade_date date not null,
  entry_at timestamptz not null,
  direction public.trade_direction not null,
  planned_rr numeric(8, 3) not null check (planned_rr > 0),
  result public.trade_result not null,
  realized_r numeric(8, 3) not null,
  session public.trading_session not null default 'other',
  session_override boolean not null default false,
  notes text check (notes is null or length(notes) <= 10000),
  visibility public.trade_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trade_images (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  storage_path text not null unique,
  image_type public.trade_image_type not null default 'other',
  timeframe text not null check (length(timeframe) between 1 and 16),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (trade_id, position)
);

create index trades_user_date_idx on public.trades(user_id, trade_date desc);
create index trades_instrument_entry_idx on public.trades(instrument_id, entry_at desc);
create index trade_images_trade_position_idx on public.trade_images(trade_id, position);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trades_updated_at before update on public.trades for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.instruments enable row level security;
alter table public.trades enable row level security;
alter table public.trade_images enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "instruments_read_authenticated" on public.instruments for select to authenticated using (true);
create policy "trades_select_own" on public.trades for select to authenticated using ((select auth.uid()) = user_id);
create policy "trades_insert_own" on public.trades for insert to authenticated with check ((select auth.uid()) = user_id and visibility = 'private');
create policy "trades_update_own" on public.trades for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "trades_delete_own" on public.trades for delete to authenticated using ((select auth.uid()) = user_id);
create policy "trade_images_select_own" on public.trade_images for select to authenticated using (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid())));
create policy "trade_images_insert_own" on public.trade_images for insert to authenticated with check (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid())));
create policy "trade_images_update_own" on public.trade_images for update to authenticated using (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid())));
create policy "trade_images_delete_own" on public.trade_images for delete to authenticated using (exists (select 1 from public.trades t where t.id = trade_id and t.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-charts', 'trade-charts', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "chart_objects_select_own" on storage.objects for select to authenticated using (bucket_id = 'trade-charts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "chart_objects_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'trade-charts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "chart_objects_update_own" on storage.objects for update to authenticated using (bucket_id = 'trade-charts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "chart_objects_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'trade-charts' and (storage.foldername(name))[1] = (select auth.uid())::text);

