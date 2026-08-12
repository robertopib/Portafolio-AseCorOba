import * as migration_20260730_133159_baseline from './20260730_133159_baseline';
import * as migration_20260730_192249_add_media_image_sizes from './20260730_192249_add_media_image_sizes';
import * as migration_20260811_114118_r23_clientes_images from './20260811_114118_r23_clientes_images';
import * as migration_20260812_015822_r23_home_order_alt from './20260812_015822_r23_home_order_alt';
import * as migration_20260812_111929_r23_drop_old_columns from './20260812_111929_r23_drop_old_columns';

export const migrations = [
  {
    up: migration_20260730_133159_baseline.up,
    down: migration_20260730_133159_baseline.down,
    name: '20260730_133159_baseline',
  },
  {
    up: migration_20260730_192249_add_media_image_sizes.up,
    down: migration_20260730_192249_add_media_image_sizes.down,
    name: '20260730_192249_add_media_image_sizes',
  },
  {
    up: migration_20260811_114118_r23_clientes_images.up,
    down: migration_20260811_114118_r23_clientes_images.down,
    name: '20260811_114118_r23_clientes_images',
  },
  {
    up: migration_20260812_015822_r23_home_order_alt.up,
    down: migration_20260812_015822_r23_home_order_alt.down,
    name: '20260812_015822_r23_home_order_alt',
  },
  {
    up: migration_20260812_111929_r23_drop_old_columns.up,
    down: migration_20260812_111929_r23_drop_old_columns.down,
    name: '20260812_111929_r23_drop_old_columns'
  },
];
