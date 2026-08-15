alter table public.trade_images
  drop constraint if exists trade_images_crop_zoom_check;

alter table public.trade_images
  add constraint trade_images_crop_zoom_check check (crop_zoom between 0.25 and 4);

comment on column public.trade_images.crop_zoom is
  'Scale of the chart inside its final frame. Values below 1 add white space around the chart.';
