import * as migration_20260730_133159_baseline from './20260730_133159_baseline';

export const migrations = [
  {
    up: migration_20260730_133159_baseline.up,
    down: migration_20260730_133159_baseline.down,
    name: '20260730_133159_baseline',
  },
];
