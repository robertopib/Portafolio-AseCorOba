import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

/**
 * Test runner config (roadmap R12, per docs/testing-standards.md §4).
 *
 * It MERGES vite.config.ts rather than restating it. The whole reason Vitest was
 * chosen over Jest is that module resolution has ONE source of truth: the `@` ->
 * ./src alias and the assetsInclude list live in vite.config.ts, and a test must
 * resolve an import exactly the way the shipped build does. Never copy a resolve
 * option in here — extend the build config instead.
 *
 * Everything below is deliberately offline: no network, no database, no secrets.
 * Renderer tests use SYNTHETIC fixtures from tests/fixtures/; the invariant tests
 * read committed content/*.json, which changes only on a deliberate local
 * fetch-content run and never from editor activity (standard §6).
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Node by default: the invariant and unit layers need no DOM and a jsdom
      // environment costs ~150 ms per file. The renderer tests opt in per file
      // with a `@vitest-environment jsdom` docblock, which also documents at the
      // top of each file which layer (standard §2) it belongs to.
      environment: 'node',

      // No `globals: true`. Every test imports describe/it/expect explicitly, so
      // a test file's dependencies are visible in the file and tsc typechecks it
      // without a `types: ["vitest/globals"]` entry in tsconfig.json.
      globals: false,

      include: [
        // Co-located unit tests, next to the source they test (standard §4).
        'src/**/*.test.{ts,tsx}',
        // Invariant, renderer and (later, R13) fidelity suites.
        'tests/**/*.test.{ts,tsx}',
      ],

      // NOT here, on purpose: Payload Local API integration tests. They need a
      // real database, which CI must never have (standard §3/§6). If such a test
      // is ever written it goes behind its own local-only script, not this glob.
    },
  }),
)
