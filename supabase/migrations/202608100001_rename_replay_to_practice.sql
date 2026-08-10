do $$
begin
  if exists (
    select 1 from pg_enum value
    join pg_type enum_type on enum_type.oid = value.enumtypid
    where enum_type.typname = 'journal_mode' and value.enumlabel = 'replay'
  ) then
    alter type public.journal_mode rename value 'replay' to 'practice';
  end if;
end $$;

comment on column public.trades.journal_mode is
  'live: real execution, study: retrospective analysis, practice: simulated execution without future knowledge';
