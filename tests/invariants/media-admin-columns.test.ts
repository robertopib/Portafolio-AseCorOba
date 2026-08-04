/**
 * Invariant layer (standard §2): the R21 regression test, paid late.
 *
 * R21 was a production outage of the media library: "elegir existente" could not
 * select anything, so images could be uploaded but never used. R10 had put
 * `preview` — a `ui` field with a custom `Cell` — first in
 * `Media.admin.defaultColumns`, and inside a Payload list drawer the FIRST column
 * is the only select affordance: the onClick→onSelect wiring lives in Payload's
 * RenderDefaultCell, which is skipped for any field carrying a custom Cell.
 *
 * R21 shipped the fix with NO regression test, because no test runner existed in
 * either project. That was recorded as debt against R12 rather than skipped, and
 * this is where it is paid. The rule from `cms/src/collections/Media.ts` —
 * "NEVER put a custom-Cell field first here" — is a comment; a comment does not
 * fail a build.
 *
 * READ AS SOURCE TEXT, not imported. Three reasons, in order of how hard they are
 * to work around:
 *   1. Media.ts's import chain reaches `sharp` and `@aws-sdk/client-s3` through
 *      its afterChange hook. Those are CMS dependencies and this runner lives in
 *      the ROOT project, which has its own separate lockfile by design
 *      (scripts/ci/check-lockfiles.mjs guards that separation). They do not
 *      resolve here and must not be made to.
 *   2. Media.ts imports types from `payload`, so typechecking it from the root
 *      tsconfig would fail for the same reason.
 *   3. The invariant is about a static config literal. Booting Payload to read it
 *      back would need a database, which CI must never have (standard §3/§6).
 *
 * Parsing source text is brittle, so every step below asserts that its own parse
 * succeeded. A silently-unparseable file must fail this suite, not skip it.
 */
import { describe, expect, it } from 'vitest'
import mediaSource from '../../cms/src/collections/Media.ts?raw'

/** The `defaultColumns: [...]` array, in order. */
function parseDefaultColumns(source: string): string[] {
  const match = source.match(/defaultColumns:\s*\[([^\]]*)\]/)
  if (!match?.[1]) return []
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1] as string)
}

/**
 * Names of fields that carry a custom `admin.components.Cell`.
 *
 * Fields are `{ name: '...', ... }` objects; a custom Cell appears as a `Cell:`
 * key somewhere inside that object. Splitting on `name:` gives one chunk per
 * field, and a chunk containing `Cell:` is a custom-Cell field.
 */
function parseCustomCellFields(source: string): string[] {
  const fieldsStart = source.indexOf('fields:')
  if (fieldsStart === -1) return []

  const chunks = source.slice(fieldsStart).split(/\bname:\s*/).slice(1)
  return chunks
    .map((chunk) => {
      const name = chunk.match(/^['"]([^'"]+)['"]/)?.[1]
      // Stop at the next field boundary so a later field's Cell is not attributed
      // to this one.
      const body = chunk.split(/\bname:\s*/)[0] ?? ''
      return name && /\bCell:\s*['"]/.test(body) ? name : undefined
    })
    .filter((name): name is string => Boolean(name))
}

const defaultColumns = parseDefaultColumns(mediaSource)
const customCellFields = parseCustomCellFields(mediaSource)

describe('Media collection — the admin list config parses at all', () => {
  /**
   * Bug it would catch: the two assertions below passing vacuously. A regex over
   * source is only as good as its match — reformat the config, rename the key, or
   * move `defaultColumns` onto a shared constant and the parse silently returns
   * nothing, at which point "no custom-Cell field is first" is trivially true and
   * the R21 outage can ship again unnoticed.
   */
  it('finds the defaultColumns array', () => {
    expect(defaultColumns.length).toBeGreaterThan(0)
  })

  /**
   * Bug it would catch: the same vacuity from the other side. If no custom-Cell
   * field is found, the check below compares against an empty set and can never
   * fail. `preview` is the field R10 added and R21 demoted; it must be here.
   */
  it('finds the custom-Cell fields, including `preview`', () => {
    expect(customCellFields).toContain('preview')
  })
})

describe('Media collection — the first admin column must be selectable', () => {
  /**
   * Regression: R21 — a custom-Cell field in column 0 made the media picker
   * unusable, because Payload's onClick→onSelect wiring lives in RenderDefaultCell
   * and is skipped for any field with a custom Cell. Images could be uploaded but
   * never chosen: the library was write-only in production.
   *
   * Bug it would catch: exactly that change being made again. It is a one-word
   * edit to a config array, it looks harmless in review, and nothing else in the
   * repo objects to it — the CMS still builds and typechecks, and the admin UI is
   * deliberately never pixel-tested (standard §3).
   */
  it('does not name a custom-Cell field first', () => {
    expect(customCellFields).not.toContain(defaultColumns[0])
  })

  /**
   * Bug it would catch: the fix being undone by DELETING the first column rather
   * than replacing it. An empty `defaultColumns` makes Payload fall back to its
   * own column choice, which is `useAsTitle` — here `alt`, a field editors often
   * leave blank, giving a drawer full of unlabelled rows to click.
   */
  it('names a real, selectable field first', () => {
    expect(defaultColumns[0]).toBe('filename')
  })
})
