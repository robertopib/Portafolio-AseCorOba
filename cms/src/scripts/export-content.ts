/**
 * Export + FIDELITY GATE — the CLI.
 *
 * Reads the Categorías → Proyectos domain model (+ globals) via the Local API
 * with locale:'all', RECONSTRUCTS the exact original content files, writes them
 * to a TEMP dir (/tmp/export-out/), then deep-diffs each temp file against the
 * committed content/*.json.  Writes /tmp/fidelity-report.json.
 *
 * Run:  pnpm payload run src/scripts/export-content.ts
 *
 * Does NOT modify the committed content/*.json (source of truth). This is now
 * literally true: EVERY emitted file goes through emit() into OUT_DIR. Until
 * R13a, `site.json`, `pages.json`, `categories.json` and `case-studies.json`
 * were written straight into CONTENT_DIR while this header claimed otherwise
 * (roadmap R16), so anyone who trusted the header and ran this against prod
 * silently overwrote the source of truth with prod data. The one script that is
 * MEANT to rewrite content/ is scripts/fetch-content.mjs.
 *
 * Exit code is the gate: 0 only when all 14 files are proven identical to the
 * committed content. A mismatch, a file with nothing to compare against, an
 * emitted file missing from the report, or a thrown exception all exit 1.
 * `FIDELITY_GATE=0` downgrades a mismatch to a warning (for the RELEASE.md
 * schema step, where the script is run against prod for its side effects and a
 * content diff is expected) — it does NOT suppress a thrown exception.
 *
 * ── Why this file is thin (R13b) ─────────────────────────────────────────────
 * The reconstruction itself lives in ./export-emit.ts. Everything that needs a
 * running CMS is here: the DB guard, `getPayload`, and the exit code. That split
 * is what lets the root test suite import the reconstruction and drive both
 * emitters over one fixture with no Payload boot and no database — the twin-
 * equivalence check this project never had. `payload run` IMPORTS the script it
 * is given rather than executing it as the main module, so an "am I the entry
 * point?" guard (the trick scripts/fetch-content.mjs uses) is not available on
 * this side; separating the CLI from the library is.
 */
import fs from 'fs'
import { getPayload } from 'payload'
import config from '@payload-config'
import { main, formatFidelityFailure, OUT_DIR } from './export-emit'
import { assertPortfolioDb } from './dbGuard'
// Every byte this file prints goes through `out`, never through `console`. This
// is the script R28 was really about: the gate-failure path below hands
// formatFidelityFailure's full multi-file report to one write and then exits, and
// on a pipe `console.error` loses everything past the first 64 KiB buffer — or,
// if earlier output has not been drained, the whole message. See
// scripts/lib/write-sync.mjs for the measurements; this file is its mirror.
import { syncConsole as out } from './write-sync'

const REPORT_PATH = '/tmp/fidelity-report.json'
const ERROR_PATH = '/tmp/export-error.json'

/**
 * `FIDELITY_GATE=0` downgrades a fidelity mismatch from "exit 1" to a warning.
 *
 * ON by default, which is the opposite of scripts/fetch-content.mjs. The
 * asymmetry is deliberate and is about what depends on the exit code: this
 * script is a verification tool nobody's build calls, so failing loudly costs
 * nothing; fetch-content.mjs is the production content producer wired into
 * vercel.json's buildCommand, where a diff from git HEAD is the normal result of
 * an editor publishing. Same detection on both sides, opposite defaults.
 *
 * The escape hatch exists for RELEASE.md's prod step, which runs this script for
 * its Payload side effects and expects prod content to differ from committed
 * content. It does not suppress a thrown exception.
 */
const GATE = process.env.FIDELITY_GATE !== '0'

try {
  // Safety: verify we're pointed at THIS project's database before Payload
  // connects (auto-push would mutate a wrong/foreign DB). See dbGuard.ts.
  await assertPortfolioDb()

  const payload = await getPayload({ config })
  const { written, report, summary } = await main({ payload })

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        allMatch: summary.allMatch,
        outDir: OUT_DIR,
        mismatched: summary.mismatched,
        unverified: summary.unverified,
        missingFromReport: summary.missingFromReport,
        files: report,
      },
      null,
      2,
    ),
  )

  if (summary.allMatch) {
    out.log(
      `[export-content] fidelity: all ${Object.keys(report).length} files match the committed content ✓ ` +
        `(reconstruction in ${OUT_DIR}, report: ${REPORT_PATH})`,
    )
  } else {
    const detail = formatFidelityFailure(report, {
      label: '[export-content]',
      reportPath: REPORT_PATH,
      expected: Object.keys(written),
    })
    if (GATE) {
      out.error(detail)
      process.exit(1)
    }
    // The FIDELITY_GATE=0 branch is exposed too, and less obviously: it prints
    // the same full report and does not exit here — it falls through to the
    // unconditional process.exit(0) at the bottom of this file, which discards
    // queued output exactly the way exit(1) does. Same truncation, exit code 0.
    out.warn(detail.replace(/^❌ /, '⚠️  '))
    out.warn('\n[export-content] exit 0: FIDELITY_GATE=0 was set, so the mismatch above is a warning.')
  }
} catch (err: any) {
  // Still write the error file — it is genuinely useful — but never swallow the
  // failure. `process.exit(0)` used to sit outside this try/catch, so a thrown
  // exception produced a clean exit and an empty fidelity report that read as a
  // pass (R13a).
  fs.writeFileSync(ERROR_PATH, JSON.stringify({ message: err.message, stack: err.stack }, null, 2))
  out.error(`❌ [export-content] FAILED: ${err.message}`)
  out.error(err.stack)
  out.error(`  Details: ${ERROR_PATH}`)
  process.exit(1)
}
// Load-bearing, and the reason R28 writes synchronously rather than assigning
// `process.exitCode`: Payload holds an open pg pool, so nothing here exits on its
// own. An exitCode-based fix would also be silently overridden by this line.
process.exit(0)
