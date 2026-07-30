import * as migration_20260730_133159_baseline from './20260730_133159_baseline';
import * as migration_20260730_192249_add_media_image_sizes from './20260730_192249_add_media_image_sizes';

export const migrations = [
  {
    up: migration_20260730_133159_baseline.up,
    down: migration_20260730_133159_baseline.down,
    name: '20260730_133159_baseline',
  },
  {
    up: migration_20260730_192249_add_media_image_sizes.up,
    down: migration_20260730_192249_add_media_image_sizes.down,
    name: '20260730_192249_add_media_image_sizes'
  },
];
