/**
 * Unit layer (standard §2 — "Project-owned pure functions | Unit | Required").
 *
 * `planCleanup()` decides which `projects` rows R23b-iii deletes. It is the only genuinely
 * destructive step in the whole R23 arc, it runs unattended inside a migration, and it will run
 * a second time against production — where the answer is a different set of rows than on dev
 * (R45: prod holds `1.jpg`, dev does not). So the thing worth testing is not "does it find 37",
 * which is a fact about one database on one day. It is the SAFETY PROPERTY:
 *
 *     a row is deleted only when its photograph is provably preserved in projects_images,
 *     and anything else stops the migration before the first write.
 *
 * Same layer, same reason and same shape as the `reconcile()` block in r23-worksheet.test.ts —
 * the abort is proved here, offline, without a database and without production.
 */
import { describe, expect, it } from 'vitest'
import {
  planCleanup,
  formatUnsafe,
  type CleanupRow,
} from '../../cms/src/lib/r23/cleanup'
import { photoKey } from '../../cms/src/lib/r23/reconcile'

/** A `projects` row in the shape the migration hands `planCleanup()`. */
const row = (over: Partial<CleanupRow> & { id: number }): CleanupRow => ({
  type: 'image',
  categoria: 'branding',
  archivo: 'wodfest-1.png',
  placement: 'page',
  imageRows: 0,
  ...over,
})

const covered = (...keys: Array<[string, string]>) =>
  new Set(keys.map(([c, a]) => photoKey(c, a)))

describe('R23b-iii cleanup — what survives', () => {
  it('never dooms a row that carries images[], whatever else it looks like', () => {
    // The parent IS the new model. It keeps its old placement/image columns until this
    // migration drops them, so it looks exactly like a leftover apart from `imageRows`.
    const parent = row({ id: 10, imageRows: 2, placement: 'page' })
    const plan = planCleanup([parent], covered(['branding', 'wodfest-1.png']))

    expect(plan.parents).toEqual([parent])
    expect(plan.doomed).toEqual([])
    expect(plan.unsafe).toEqual([])
  })

  it('never dooms the case study — the one Proyecto with no photograph at all', () => {
    // It has no image, no images[], and today a required `placement`. Under a rule phrased as
    // "delete rows with an empty images[]" it would be deleted. It is `type: 'caseStudy'`, so
    // it is retained before the photograph test is ever reached.
    const caseStudy = row({ id: 638, type: 'caseStudy', archivo: null, categoria: 'uxui-producto' })
    const plan = planCleanup([caseStudy], new Set())

    expect(plan.retained).toEqual([caseStudy])
    expect(plan.doomed).toEqual([])
    expect(plan.unsafe).toEqual([])
  })
})

describe('R23b-iii cleanup — what is deleted', () => {
  it('dooms a redundant row once its photograph is proven to live in images[]', () => {
    const leftover = row({ id: 581, placement: 'home' })
    const plan = planCleanup([leftover], covered(['branding', 'wodfest-1.png']))

    expect(plan.doomed).toEqual([leftover])
    expect(plan.unsafe).toEqual([])
  })

  it('partitions a whole database in one pass, and every row lands in exactly one bucket', () => {
    const rows = [
      row({ id: 1, imageRows: 3 }),
      row({ id: 2, imageRows: 1, categoria: 'web-apps', archivo: 'offday.png' }),
      row({ id: 3 }),
      row({ id: 4, placement: 'home' }),
      row({ id: 5, categoria: 'web-apps', archivo: 'offday.png' }),
      row({ id: 638, type: 'caseStudy', archivo: null }),
    ]
    const plan = planCleanup(rows, covered(['branding', 'wodfest-1.png'], ['web-apps', 'offday.png']))

    expect(plan.parents.map((r) => r.id)).toEqual([1, 2])
    expect(plan.retained.map((r) => r.id)).toEqual([638])
    expect(plan.doomed.map((r) => r.id)).toEqual([3, 4, 5])
    expect(plan.unsafe).toEqual([])
    expect(
      plan.parents.length + plan.retained.length + plan.doomed.length + plan.unsafe.length,
    ).toBe(rows.length)
  })
})

describe('R23b-iii cleanup — what aborts', () => {
  it('ABORTS on a photograph the new model does not carry, and names the file', () => {
    // The failure this exists for: an editor adds a card in the prod admin after the backfill.
    // It has no images[] (nothing built one for it) and no image row covers its photograph, so
    // "delete every row with an empty images[]" would silently destroy it.
    const stray = row({ id: 700, categoria: 'fotografia-producto', archivo: '2.jpg', placement: 'both' })
    const plan = planCleanup([stray], covered(['branding', 'wodfest-1.png']))

    expect(plan.doomed).toEqual([])
    expect(plan.unsafe).toHaveLength(1)
    expect(plan.unsafe[0]!.id).toBe(700)

    const message = formatUnsafe(plan.unsafe)
    expect(message).toContain(
      "fotografia-producto|2.jpg — projects row #700, placement 'both': its photograph appears in no images[] row",
    )
    expect(message).toContain('Nothing has been changed.')
  })

  it('ABORTS on a candidate with no media rather than assuming it is junk', () => {
    const noMedia = row({ id: 701, archivo: null })
    const plan = planCleanup([noMedia], covered(['branding', 'wodfest-1.png']))

    expect(plan.doomed).toEqual([])
    expect(formatUnsafe(plan.unsafe)).toContain('it carries no image, so there is nothing to match')
  })

  it('ABORTS on a candidate with no categoría — the key needs both halves', () => {
    const noCat = row({ id: 702, categoria: null })
    const plan = planCleanup([noCat], covered(['branding', 'wodfest-1.png']))

    expect(plan.doomed).toEqual([])
    expect(formatUnsafe(plan.unsafe)).toContain('it belongs to no categoría')
  })

  it('names every unsafe row, not just the first', () => {
    const plan = planCleanup(
      [row({ id: 700, archivo: '2.jpg' }), row({ id: 701, archivo: '3.jpg' })],
      covered(['branding', 'wodfest-1.png']),
    )
    const message = formatUnsafe(plan.unsafe)

    expect(plan.unsafe).toHaveLength(2)
    expect(message).toContain('2 projects rows cannot be shown to be redundant')
    expect(message).toContain('#700')
    expect(message).toContain('#701')
  })

  it('matches on categoría AND filename, so the same filename in two categorías is not a pass', () => {
    // `photoKey` is shared with reconcile() precisely so the two sides cannot drift. A
    // photograph covered under branding must not license deleting a marketing row.
    const marketing = row({ id: 703, categoria: 'marketing-360', archivo: 'wodfest-1.png' })
    const plan = planCleanup([marketing], covered(['branding', 'wodfest-1.png']))

    expect(plan.doomed).toEqual([])
    expect(plan.unsafe).toHaveLength(1)
  })
})
