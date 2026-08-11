import * as migration_20260730_133159_baseline from './20260730_133159_baseline';
import * as migration_20260730_192249_add_media_image_sizes from './20260730_192249_add_media_image_sizes';
import * as migration_20260811_114118_r23_clientes_images from './20260811_114118_r23_clientes_images';

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
    name: '20260811_114118_r23_clientes_images'
  },
];
