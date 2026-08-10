alter table public.trade_images
  add column instrument_symbol text,
  add column capture_preset text,
  add column is_composed boolean not null default false;

alter table public.trade_images
  add constraint trade_images_capture_preset_check check (capture_preset is null or capture_preset in ('standard', 'wide'));

comment on column public.trade_images.instrument_symbol is 'Instrument embedded in or assigned to this individual chart.';
comment on column public.trade_images.capture_preset is 'Final composition preset: standard or wide.';
comment on column public.trade_images.is_composed is 'True when the stored file already contains its own header and footer.';
