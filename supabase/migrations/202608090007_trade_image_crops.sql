alter table public.trade_images
  add column crop_x numeric(7, 4) not null default 0,
  add column crop_y numeric(7, 4) not null default 0,
  add column crop_width numeric(7, 4) not null default 100,
  add column crop_height numeric(7, 4) not null default 100,
  add column crop_zoom numeric(6, 3) not null default 1,
  add column crop_rotation numeric(6, 2) not null default 0,
  add column aspect_ratio text not null default '4:3';

alter table public.trade_images
  add constraint trade_images_crop_x_check check (crop_x between 0 and 100),
  add constraint trade_images_crop_y_check check (crop_y between 0 and 100),
  add constraint trade_images_crop_width_check check (crop_width > 0 and crop_width <= 100 and crop_x + crop_width <= 100.01),
  add constraint trade_images_crop_height_check check (crop_height > 0 and crop_height <= 100 and crop_y + crop_height <= 100.01),
  add constraint trade_images_crop_zoom_check check (crop_zoom between 1 and 4),
  add constraint trade_images_crop_rotation_check check (crop_rotation between -180 and 180),
  add constraint trade_images_aspect_ratio_check check (aspect_ratio = '4:3');

comment on column public.trade_images.crop_x is 'Left edge of the visible source area, as a percentage.';
comment on column public.trade_images.crop_y is 'Top edge of the visible source area, as a percentage.';
comment on column public.trade_images.crop_width is 'Width of the visible source area, as a percentage.';
comment on column public.trade_images.crop_height is 'Height of the visible source area, as a percentage.';
