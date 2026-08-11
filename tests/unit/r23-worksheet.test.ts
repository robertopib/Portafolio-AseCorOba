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
 * and narrow: the worksheet is a **closed, signed-off document about 40 fixed photographs**,
 * not growing content. 40 counts distinct media and cannot change without a content change;
 * 16 and 20 are the owner's answers. If one of them moves, the migration's assumptions moved
 * with it and this test going red is the correct outcome, not noise.
 */
import { describe, expect, it } from 'vitest'
import {
  parseWorksheet,
  clientNames,
  projectKey,
  NO_CLIENT,
  type WorksheetEntry,
} from '../../cms/src/lib/r23/parseWorksheet'
import { R23_CLIENT_MAP } from '../../cms/src/lib/r23/clientMap.generated'
import worksheetMd from '../../docs/delivery/r23-backfill-mapping.md?raw'

/** The cross-check from the R23b-i task prompt, computed there from the completed worksheet. */
const EXPECTED_IMAGES = 40
const EXPECTED_CLIENTS = 16
const EXPECTED_PROJECTS = 20
const EXPECTED_NO_CLIENT = 3

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
  it('answers every one of the 40 client cells (blank would have thrown)', () => {
    expect(parsed).toHaveLength(EXPECTED_IMAGES)
    expect(parsed.filter((e) => e.cliente === '')).toEqual([])
  })

  it('covers exactly the photographs in committed content — no gaps, no strays', () => {
    const fromContent = imagesFromContent()
    expect(fromContent.size).toBe(EXPECTED_IMAGES)
    expect([...new Set(parsed.map(key))].sort()).toEqual([...fromContent].sort())
  })

  it('yields the counts the migration cross-checks against', () => {
    expect(clientNames(parsed)).toHaveLength(EXPECTED_CLIENTS)
    expect(new Set(parsed.map(projectKey)).size).toBe(EXPECTED_PROJECTS)
    expect(parsed.filter((e) => e.cliente === null)).toHaveLength(EXPECTED_NO_CLIENT)
  })

  it('reconciles: client-bearing projects exceed clients by exactly OFF DAY Trainer', () => {
    // 20 projects − 3 no-client = 17 client-bearing; 17 − 16 clients = 1 client with work in
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
    expect(noClient).toEqual(['concert-banner.png', 'fisioterapia-cards.png', 'live-betting.png'])
    expect(NO_CLIENT).toBe('—')
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
