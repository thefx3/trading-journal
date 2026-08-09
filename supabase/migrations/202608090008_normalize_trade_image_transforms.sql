alter table public.trade_images
  drop constraint if exists trade_images_crop_x_check,
  drop constraint if exists trade_images_crop_y_check,
  drop constraint if exists trade_images_crop_width_check,
  drop constraint if exists trade_images_crop_height_check;

update public.trade_images
set crop_x = 0, crop_y = 0, crop_width = 100, crop_height = 100, crop_zoom = 1, crop_rotation = 0;

alter table public.trade_images
  add constraint trade_images_crop_x_check check (crop_x between -200 and 200),
  add constraint trade_images_crop_y_check check (crop_y between -200 and 200),
  add constraint trade_images_crop_width_check check (crop_width > 0 and crop_width <= 100),
  add constraint trade_images_crop_height_check check (crop_height > 0 and crop_height <= 100);

comment on column public.trade_images.crop_x is 'Horizontal image translation as a percentage of the 4:3 viewport width.';
comment on column public.trade_images.crop_y is 'Vertical image translation as a percentage of the 4:3 viewport height.';
comment on column public.trade_images.crop_width is 'Legacy crop-area field retained for backwards compatibility.';
comment on column public.trade_images.crop_height is 'Legacy crop-area field retained for backwards compatibility.';
