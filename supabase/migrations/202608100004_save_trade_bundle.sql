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
    session_override, notes, visibility
  ) values (
    v_trade_id,
    (p_trade ->> 'user_id')::uuid,
    (p_trade ->> 'instrument_id')::uuid,
    nullif(p_trade ->> 'setup_id', '')::uuid,
    (p_trade ->> 'trade_date')::date,
    nullif(p_trade ->> 'entry_at', '')::timestamptz,
    nullif(p_trade ->> 'direction', '')::public.trade_direction,
    nullif(p_trade ->> 'planned_rr', '')::numeric,
    nullif(p_trade ->> 'result', '')::public.trade_result,
    nullif(p_trade ->> 'realized_r', '')::numeric,
    (p_trade ->> 'journal_mode')::public.journal_mode,
    coalesce((p_trade ->> 'setup_found')::boolean, true),
    (p_trade ->> 'session')::public.trading_session,
    coalesce((p_trade ->> 'session_override')::boolean, false),
    nullif(p_trade ->> 'notes', ''),
    'private'::public.trade_visibility
  )
  on conflict (id) do update set
    instrument_id = excluded.instrument_id,
    setup_id = excluded.setup_id,
    trade_date = excluded.trade_date,
    entry_at = excluded.entry_at,
    direction = excluded.direction,
    planned_rr = excluded.planned_rr,
    result = excluded.result,
    realized_r = excluded.realized_r,
    journal_mode = excluded.journal_mode,
    setup_found = excluded.setup_found,
    session = excluded.session,
    session_override = excluded.session_override,
    notes = excluded.notes;

  delete from public.study_entries where trade_id = v_trade_id;
  for item in select value from jsonb_array_elements(p_study_entries)
  loop
    insert into public.study_entries (
      trade_id, position, entry_at, session, session_override, direction,
      planned_rr, result, realized_r
    ) values (
      v_trade_id,
      (item ->> 'position')::integer,
      (item ->> 'entry_at')::timestamptz,
      (item ->> 'session')::public.trading_session,
      coalesce((item ->> 'session_override')::boolean, false),
      (item ->> 'direction')::public.trade_direction,
      (item ->> 'planned_rr')::numeric,
      (item ->> 'result')::public.trade_result,
      (item ->> 'realized_r')::numeric
    );
  end loop;

  for item in select value from jsonb_array_elements(p_images)
  loop
    insert into public.trade_images (
      trade_id, storage_path, image_type, timeframe, instrument_symbol,
      capture_preset, is_composed, position, crop_x, crop_y, crop_width,
      crop_height, crop_zoom, crop_rotation, aspect_ratio
    ) values (
      v_trade_id,
      item ->> 'storage_path',
      (item ->> 'image_type')::public.trade_image_type,
      item ->> 'timeframe',
      item ->> 'instrument_symbol',
      item ->> 'capture_preset',
      (item ->> 'is_composed')::boolean,
      (item ->> 'position')::integer,
      (item ->> 'crop_x')::numeric,
      (item ->> 'crop_y')::numeric,
      (item ->> 'crop_width')::numeric,
      (item ->> 'crop_height')::numeric,
      (item ->> 'crop_zoom')::numeric,
      (item ->> 'crop_rotation')::numeric,
      item ->> 'aspect_ratio'
    );
  end loop;

  for item in select value from jsonb_array_elements(p_existing_images)
  loop
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
