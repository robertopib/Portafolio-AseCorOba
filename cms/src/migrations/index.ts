import * as migration_20260730_133159_baseline from './20260730_133159_baseline';
import * as migration_20260730_133343_testdelta from './20260730_133343_testdelta';

export const migrations = [
  {
    up: migration_20260730_133159_baseline.up,
    down: migration_20260730_133159_baseline.down,
    name: '20260730_133159_baseline',
  },
  {
    up: migration_20260730_133343_testdelta.up,
    down: migration_20260730_133343_testdelta.down,
    name: '20260730_133343_testdelta'
  },
];
