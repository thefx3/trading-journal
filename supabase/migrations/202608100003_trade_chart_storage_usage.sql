create or replace function public.get_trade_chart_storage_usage()
returns bigint
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(sum(coalesce((metadata ->> 'size')::bigint, 0)), 0)::bigint
  from storage.objects
  where bucket_id = 'trade-charts';
$$;

revoke all on function public.get_trade_chart_storage_usage() from public;
grant execute on function public.get_trade_chart_storage_usage() to authenticated;

comment on function public.get_trade_chart_storage_usage() is
  'Returns the total bytes stored in the private trade-charts bucket.';
