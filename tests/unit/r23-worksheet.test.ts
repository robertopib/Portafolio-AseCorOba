/**
 * Unit layer (standard §2 — "Project-owned pure functions | Unit | Required").
 *
 * `parseWorksheet()` reads the owner's client answers out of the committed worksheet, and
 * those answers decide which photographs become one Proyecto. A wrong client on the right
 * file forms a wrong project that **would look correct** — the worksheet says so in its own
 * words (r23-backfill-mapping.md §3.1). So this is not a formatting test; it is the gate.
 *
 * IT IS ALSO §5.3 CHECK 0. r23-target-model.md §5.3 requires proving all 40 client cells are
 * answered "before touching the database". That check ran once during R23b-i; keeping it here
 * makes it permanent and offline, so a later edit to the worksheet or to the committed map
 * cannot silently diverge from what the migration will do on production.
 *
 * Everything is read with Vite's `?raw` / `import.meta.glob` rather than node:fs — the root
 * tsconfig deliberately has no @types/node (tests/env.d.ts).
 *
 * The counts asserted below ARE pinned, against this suite's usual "pin the invariant, never
 * the census" rule (see tests/invariants/content-shape.test.ts). The exception is deliberate
 * and narrow: the worksheet is a **closed, signed-off document about fixed photographs**, not
 * growing content. The counts are the owner's answers; if one of them moves, the migration's
 * assumptions moved with it and this test going red is the correct outcome, not noise.
 *
 * ── R49, 2026-08-11 ─────────────────────────────────────────────────────────────────────────
 * Two changes, and the second is the substantive one.
 *
 * 1. The counts moved 40/20/3 → 41/21/4: `1.jpg` was added to the worksheet as `—`, a
 *    photograph the owner uploaded in the **production** admin after signing (R45).
 * 2. **"Covers exactly the photographs in committed content" became directional.** Committed
 *    content is a snapshot of *one* database; production legitimately holds more. So the
 *    invariant is now **content ⊆ worksheet** — no photograph may be missing an answer — plus
 *    an exact pin on which extras are permitted. That is the same tightness as the old set
 *    equality (an unexpected stray still fails, by name), reading in the direction that is
 *    actually true of both databases. It mirrors the migration's own R49 change; the reason
 *    lives in `cms/src/lib/r23/reconcile.ts`.
 */
import { describe, expect, it } from 'vitest'
import {
  parseWorksheet,
  clientNames,
  projectKey,
  NO_CLIENT,
  type WorksheetEntry,
} from '../../cms/src/lib/r23/parseWorksheet'
import {
  reconcile,
  formatUnknown,
  photoKey,
  type DbPhotograph,
} from '../../cms/src/lib/r23/reconcile'
import { R23_CLIENT_MAP } from '../../cms/src/lib/r23/clientMap.generated'
import worksheetMd from '../../docs/delivery/r23-backfill-mapping.md?raw'

/** The cross-check from the R23b-i task prompt, plus R49's one post-signature row. */
const EXPECTED_IMAGES = 41
const EXPECTED_CLIENTS = 16
const EXPECTED_PROJECTS = 21
const EXPECTED_NO_CLIENT = 4

/**
 * The photographs the worksheet describes that committed content does NOT contain, pinned by
 * name. Committed content mirrors dev; each entry here is a production-only row that the
 * migration must still know about. Adding to this list is a deliberate act, never a fixup.
 */
const PRODUCTION_ONLY = ['fotografia-producto|1.jpg']

const parsed = parseWorksheet(worksheetMd)

/**
 * The 40 distinct photographs, derived from committed content **independently of the
 * worksheet** — one entry per (category, media file), exactly as /tmp/r23-worksheet.mjs
 * does it (r23-backfill-mapping.md §5). This is the half of the check the worksheet cannot
 * fake: if the parser silently skipped a table, its key set stops matching this one.
 */
const sections = import.meta.glob<any>('../../content/sections/*.json', {
  eager: true,
  import: 'default',
})

const sectionFor = (file: string) =>
  sections[`../../content/sections/${file}`] ??
  (() => {
    throw new Error(`fixture missing: content/sections/${file}`)
  })()

const BRANDING_PAGE_GROUPS = [
  'sportsProjects',
  'adrianaMunozProjects',
  'anaGraceProjects',
  'logoProjects',
]

const basename = (p: string) => p.split('/').pop()!

function imagesFromContent(): Set<string> {
  const keys = new Set<string>()
  const add = (slug: string, src: string) => keys.add(`${slug}|${basename(src)}`)

  const branding = sectionFor('branding.json')
  branding.home.images.forEach((it: any) => add('branding', it.src))
  for (const g of BRANDING_PAGE_GROUPS)
    branding.page[g].forEach((it: any) => add('branding', it.src))

  for (const [slug, file] of [
    ['fotografia-producto', 'photography.json'],
    ['marketing-360', 'marketing-360.json'],
    ['web-apps', 'web-apps.json'],
  ] as const) {
    const d = sectionFor(file)
    d.home.projects.forEach((it: any) => add(slug, it.image))
    d.page.projects.forEach((it: any) => add(slug, it.image))
  }

  return keys
}

const key = (e: WorksheetEntry) => `${e.categoria}|${e.archivo}`

describe('R23 client worksheet — §5.3 check 0', () => {
  it('answers every one of the client cells (blank would have thrown)', () => {
    expect(parsed).toHaveLength(EXPECTED_IMAGES)
    expect(parsed.filter((e) => e.cliente === '')).toEqual([])
  })

  it('covers every photograph in committed content, and names every extra', () => {
    // Direction, not equality — see the R49 note in the docblock. The `⊆` half is the safety
    // property: a photograph with no answer forms no project. The pin on the difference is what
    // keeps this as strict as the equality it replaced.
    const fromContent = imagesFromContent()
    const answered = new Set(parsed.map(key))

    const missing = [...fromContent].filter((k) => !answered.has(k))
    expect(missing).toEqual([])

    const extra = [...answered].filter((k) => !fromContent.has(k))
    expect(extra.sort()).toEqual([...PRODUCTION_ONLY].sort())
    expect(fromContent.size + PRODUCTION_ONLY.length).toBe(EXPECTED_IMAGES)
  })

  it('yields the counts the migration cross-checks against', () => {
    expect(clientNames(parsed)).toHaveLength(EXPECTED_CLIENTS)
    expect(new Set(parsed.map(projectKey)).size).toBe(EXPECTED_PROJECTS)
    expect(parsed.filter((e) => e.cliente === null)).toHaveLength(EXPECTED_NO_CLIENT)
  })

  it('reconciles: client-bearing projects exceed clients by exactly OFF DAY Trainer', () => {
    // 21 projects − 4 no-client = 17 client-bearing; 17 − 16 clients = 1 client with work in
    // two categorías. This is the case the whole Cliente axis exists for (§3.0), so name it.
    const spanning = clientNames(parsed).filter(
      (name) => new Set(parsed.filter((e) => e.cliente === name).map((e) => e.categoria)).size > 1,
    )
    expect(spanning).toEqual(['OFF DAY Trainer'])
    expect(EXPECTED_PROJECTS - EXPECTED_NO_CLIENT - EXPECTED_CLIENTS).toBe(spanning.length)
  })

  it('reads the client from the column, not the heading, where both exist', () => {
    // The five logos sit under `**Los cinco logos** · Branding → …`, which is a section label,
    // not a client. Precedence is what stops five separate logo clients collapsing into one
    // invented one — the exact class of error the worksheet exists to prevent.
    const logos = parsed.filter((e) =>
      ['la-dulcereta.png', 'fit-cookie.png', 'nomads.png', 'la-pedrena.png', 'falecon.png'].includes(
        e.archivo,
      ),
    )
    expect(logos).toHaveLength(5)
    expect(new Set(logos.map((e) => e.cliente)).size).toBe(5)
    expect(logos.map((e) => e.cliente)).not.toContain('Los cinco logos')
  })

  it('resolves a client the row text does not name', () => {
    // The finding that killed R23a's prefix-grouping: `Croissant Artesanal` carries no client
    // marker at all, yet is D'Argent's. Only the owner's column can produce this.
    expect(parsed.find((e) => e.archivo === 'croissant.png')?.cliente).toBe("D'Argent")
    expect(parsed.find((e) => e.archivo === 'crackers.png')?.cliente).toBe("D'Argent")
  })
})

describe('R23 client map — the frozen copy the migration imports', () => {
  it('still equals the worksheet', () => {
    // clientMap.generated.ts is committed so the migration is a deterministic snapshot and
    // never reads docs/ at migrate time. Nothing else keeps the two in step — this does.
    // Regenerate with: node --experimental-strip-types cms/src/scripts/r23-generate-client-map.ts
    expect([...R23_CLIENT_MAP]).toEqual(parsed)
  })
})

describe('parseWorksheet — the gate itself', () => {
  it('throws on a blank cell rather than dropping the row', () => {
    // Blank means "not answered". Silently skipping it would land a partial backfill; the
    // whole point of §5.2's gate is that it cannot be produced by accident.
    const blanked = worksheetMd.replace(
      '| **B5** | 16 | `snaga-relay.png` | SNAGA Team Relay 9th Anniversary | `sports` | página | **Crossfit SNAGA** |',
      '| **B5** | 16 | `snaga-relay.png` | SNAGA Team Relay 9th Anniversary | `sports` | página |  |',
    )
    expect(blanked).not.toBe(worksheetMd) // the row must still exist to be blanked
    expect(() => parseWorksheet(blanked)).toThrow(/BLANK client cell for branding\/snaga-relay/)
  })

  it('treats — as an answer, not a blank', () => {
    const noClient = parsed.filter((e) => e.cliente === null).map((e) => e.archivo)
    expect(noClient).toEqual([
      '1.jpg',
      'concert-banner.png',
      'fisioterapia-cards.png',
      'live-betting.png',
    ])
    expect(NO_CLIENT).toBe('—')
  })

  it('reads a photograph whose filename is not a .png', () => {
    // The 40 signed photographs are all PNG; `1.jpg` was uploaded to production afterwards, and
    // the parser's stray-row filter used to be `endsWith('.png')` — which dropped it silently,
    // the one failure mode this whole worksheet exists to prevent.
    expect(parsed.find((e) => e.archivo === '1.jpg')).toEqual({
      categoria: 'fotografia-producto',
      archivo: '1.jpg',
      cliente: null,
    })
  })

  it('fails loudly if a category heading is renamed', () => {
    const renamed = worksheetMd.replace(
      '### 2.3 Marketing 360° — 4 imágenes, 8 filas',
      '### 2.3 Marketing — 4 imágenes, 8 filas',
    )
    expect(renamed).not.toBe(worksheetMd)
    expect(() => parseWorksheet(renamed)).toThrow(/section 2\.3 is titled "Marketing"/)
  })
})

/**
 * R49 — the assertion that replaced `EXPECTED = { …, sourceRows: 57 }`.
 *
 * This is the half of the migration that decides whether a promotion runs or aborts, and it is
 * the reason `reconcile()` is a pure function in `cms/src/lib/r23/` rather than inline in the
 * migration: the abort can be proved here, offline, without a database and without production.
 *
 * The two databases below are the real ones, as measured by R45 on 2026-08-11 — dev holds the 40
 * signed photographs, production holds those plus `1.jpg`. The point of the change is that ONE
 * migration file is correct against BOTH, which no single count can be.
 */
describe('R23 reconciliation — every database row must have a worksheet answer', () => {
  /** A `projects` row per photograph, the shape the migration hands `reconcile()`. */
  const db = (keys: string[]): Map<string, DbPhotograph> =>
    new Map(keys.map((k, i) => [k, { id: 500 + i, placement: 'page' }]))

  const allKeys = parsed.map(key)
  const devKeys = allKeys.filter((k) => !PRODUCTION_ONLY.includes(k))

  it('accepts dev, which holds 40 of the 41 photographs', () => {
    const state = reconcile(parsed, db(devKeys))
    expect(state.unknown).toEqual([])
    expect(state.covered).toHaveLength(devKeys.length)
    // The missing one is reported, not fatal — that is the whole change.
    expect(state.unused).toEqual(PRODUCTION_ONLY)
  })

  it('accepts production, which holds all 41', () => {
    const state = reconcile(parsed, db(allKeys))
    expect(state.unknown).toEqual([])
    expect(state.unused).toEqual([])
    expect(state.covered).toHaveLength(EXPECTED_IMAGES)
    // 21 parents and 16 clients on production, against 20 and 16 on dev — from the same file.
    expect(new Set(state.covered.map(projectKey)).size).toBe(EXPECTED_PROJECTS)
    expect(clientNames(state.covered)).toHaveLength(EXPECTED_CLIENTS)
  })

  it('derives dev’s 20 parents from the same worksheet', () => {
    const state = reconcile(parsed, db(devKeys))
    expect(new Set(state.covered.map(projectKey)).size).toBe(EXPECTED_PROJECTS - 1)
    expect(clientNames(state.covered)).toHaveLength(EXPECTED_CLIENTS)
  })

  it('ABORTS on a row the worksheet does not describe, and names the file', () => {
    // The safety property the census was standing in for. This is R45's finding replayed exactly:
    // the worksheet as it stood before R49 (no `1.jpg` entry) against production as it stands now
    // (the row is there, #581, the only `placement: 'both'` row in either database).
    const beforeR49 = parsed.filter((e) => key(e) !== 'fotografia-producto|1.jpg')
    expect(beforeR49).toHaveLength(EXPECTED_IMAGES - 1)

    const state = reconcile(
      beforeR49,
      new Map<string, DbPhotograph>([
        ...db(devKeys),
        ['fotografia-producto|1.jpg', { id: 581, placement: 'both' }],
      ]),
    )
    expect(state.unknown).toEqual([
      { key: 'fotografia-producto|1.jpg', id: 581, placement: 'both' },
    ])

    const message = formatUnknown(state.unknown)
    expect(message).toContain(
      "fotografia-producto|1.jpg exists in the database but has no client cell in the worksheet (projects row #581, placement 'both').",
    )
    // Naming the row and the fix is what turned R45's abort into a 2-line worksheet edit.
    expect(message).toContain('docs/delivery/r23-backfill-mapping.md')
    expect(message).toContain('r23-generate-client-map.ts')
  })

  it('names every unknown row, not just the first', () => {
    // `2.jpg`…`15.jpg` are staged in production and unattached. If the owner places several
    // before the promotion, one abort should list all of them rather than one per re-run.
    const state = reconcile(
      parsed,
      new Map<string, DbPhotograph>([
        ...db(allKeys),
        ['fotografia-producto|2.jpg', { id: 601, placement: 'page' }],
        ['fotografia-producto|3.jpg', { id: 602, placement: 'home' }],
      ]),
    )
    expect(state.unknown.map((u) => u.key)).toEqual([
      'fotografia-producto|2.jpg',
      'fotografia-producto|3.jpg',
    ])
    const message = formatUnknown(state.unknown)
    expect(message).toContain('2 photographs exist in the database')
    expect(message).toContain('fotografia-producto|2.jpg exists in the database')
    expect(message).toContain('fotografia-producto|3.jpg exists in the database')
  })

  it('an empty database orphans nothing and backfills nothing', () => {
    // Not a fatal case by design: `unused` is informational. The migration's own vacuity floor
    // (MIN_WORKSHEET_ENTRIES) guards the mirror image — an empty worksheet.
    const state = reconcile(parsed, db([]))
    expect(state.unknown).toEqual([])
    expect(state.covered).toEqual([])
    expect(state.unused).toHaveLength(EXPECTED_IMAGES)
  })

  it('builds its keys the same way the migration does', () => {
    expect(photoKey('fotografia-producto', '1.jpg')).toBe('fotografia-producto|1.jpg')
    expect(allKeys).toContain(photoKey('fotografia-producto', '1.jpg'))
  })
})
