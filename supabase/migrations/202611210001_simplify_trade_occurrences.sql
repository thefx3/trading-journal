-- Risknote's simplified occurrence model. Legacy columns stay in place so
-- existing journals remain readable, but new writes no longer use them.

alter table public.trades drop constraint if exists trades_mode_fields_check;
alter table public.trades drop constraint if exists trades_study_setup_check;

-- Preserve the informative outcome of already-recorded missed opportunities.
update public.trades
set
  realized_r = theoretical_r,
  result = case
    when theoretical_r > 0 then 'win'::public.trade_result
    when theoretical_r < 0 then 'loss'::public.trade_result
    else 'be'::public.trade_result
  end,
  theoretical_r = null
where trade_status = 'missed' and theoretical_r is not null;

alter table public.trades add constraint trades_simplified_fields_check check (
  trade_status is null
  or (
    direction is not null
    and result is not null
    and realized_r is not null
    and setup_validity is not null
    and execution_quality is not null
    and (execution_quality = 'bad' or execution_error is null)
    and (execution_quality = 'good' or execution_error is not null)
    and (trade_status <> 'missed' or execution_quality = 'bad')
    and (trade_status <> 'missed' or setup_validity = 'valid')
    and (setup_validity <> 'invalid' or execution_quality = 'bad')
  )
);

comment on column public.trades.realized_r is
  'Outcome in R. For missed opportunities it is informative only and excluded from performance statistics.';

create or replace function public.save_trade_bundle(
  p_trade jsonb,
  p_study_entries jsonb default '[]'::jsonb,
  p_images jsonb default '[]'::jsonb,
  p_existing_images jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trade_id uuid := (p_trade ->> 'id')::uuid;
  item jsonb;
begin
  if (p_trade ->> 'user_id')::uuid is distinct from (select auth.uid()) then
    raise exception 'Trade owner does not match the authenticated user';
  end if;

  insert into public.trades (
    id, user_id, instrument_id, setup_id, trade_date, entry_at, direction,
    planned_rr, result, realized_r, journal_mode, setup_found, session,
    session_override, notes, visibility, setup_validity, execution_quality,
    trade_status, theoretical_r, execution_error
  ) values (
    v_trade_id, (p_trade ->> 'user_id')::uuid,
    (p_trade ->> 'instrument_id')::uuid, null,
    (p_trade ->> 'trade_date')::date, null,
    (p_trade ->> 'direction')::public.trade_direction, null,
    (p_trade ->> 'result')::public.trade_result,
    (p_trade ->> 'realized_r')::numeric,
    (p_trade ->> 'journal_mode')::public.journal_mode, true,
    (p_trade ->> 'session')::public.trading_session, true,
    nullif(p_trade ->> 'notes', ''), 'private'::public.trade_visibility,
    (p_trade ->> 'setup_validity')::public.setup_validity,
    (p_trade ->> 'execution_quality')::public.execution_quality,
    (p_trade ->> 'trade_status')::public.trade_status, null,
    nullif(p_trade ->> 'execution_error', '')::public.execution_error
  )
  on conflict (id) do update set
    instrument_id = excluded.instrument_id,
    setup_id = null,
    trade_date = excluded.trade_date,
    entry_at = null,
    direction = excluded.direction,
    planned_rr = null,
    result = excluded.result,
    realized_r = excluded.realized_r,
    journal_mode = excluded.journal_mode,
    setup_found = true,
    session = excluded.session,
    session_override = true,
    notes = excluded.notes,
    setup_validity = excluded.setup_validity,
    execution_quality = excluded.execution_quality,
    trade_status = excluded.trade_status,
    theoretical_r = null,
    execution_error = excluded.execution_error;

  delete from public.study_entries where trade_id = v_trade_id;

  for item in select value from jsonb_array_elements(p_images) loop
    insert into public.trade_images (
      trade_id, storage_path, image_type, timeframe, instrument_symbol,
      capture_preset, is_composed, position, crop_x, crop_y, crop_width,
      crop_height, crop_zoom, crop_rotation, aspect_ratio
    ) values (
      v_trade_id, item ->> 'storage_path',
      (item ->> 'image_type')::public.trade_image_type,
      item ->> 'timeframe', item ->> 'instrument_symbol',
      item ->> 'capture_preset', (item ->> 'is_composed')::boolean,
      (item ->> 'position')::integer, (item ->> 'crop_x')::numeric,
      (item ->> 'crop_y')::numeric, (item ->> 'crop_width')::numeric,
      (item ->> 'crop_height')::numeric, (item ->> 'crop_zoom')::numeric,
      (item ->> 'crop_rotation')::numeric, item ->> 'aspect_ratio'
    );
  end loop;

  for item in select value from jsonb_array_elements(p_existing_images) loop
    update public.trade_images set
      crop_x = (item ->> 'crop_x')::numeric,
      crop_y = (item ->> 'crop_y')::numeric,
      crop_width = (item ->> 'crop_width')::numeric,
      crop_height = (item ->> 'crop_height')::numeric,
      crop_zoom = (item ->> 'crop_zoom')::numeric,
      crop_rotation = (item ->> 'crop_rotation')::numeric,
      aspect_ratio = item ->> 'aspect_ratio'
    where id = (item ->> 'id')::uuid and trade_id = v_trade_id;
  end loop;

  return v_trade_id;
end;
$$;

revoke all on function public.save_trade_bundle(jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.save_trade_bundle(jsonb, jsonb, jsonb, jsonb) to authenticated;
