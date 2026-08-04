/**
 * Unit layer (standard §2's worked example). Co-located next to the source.
 *
 * `fieldVisible` and `fieldLabel` are pure, project-owned and dependency-free,
 * and the site's pixel-identity guarantee rests on their exact defaults. Every
 * section renderer calls them — HeroSection.tsx:33/:48/:55, and again in every
 * gallery and header block — so their defaults decide whether content that
 * predates the show/hide feature renders at all.
 *
 * Two operators do all the load-bearing work here, and R17's ingest showed both
 * are easy to reason about wrongly:
 *   - `v !== false` in fieldVisible  (NOT `v === true`)
 *   - `?? fallback`  in fieldLabel   (NOT `|| fallback`)
 * Each has its own test below saying what breaks when it is changed.
 *
 * No DOM: these run in the default `node` environment.
 */
import { describe, expect, it } from 'vitest'
import { fieldLabel, fieldLabelFor, fieldVisible, fieldVisibleFor } from './contentMeta'

describe('fieldVisible — default-visible', () => {
  /**
   * Bug it would catch: `v !== false` changed to `v === true`.
   *
   * The CMS emits `<name>Visible` only once an editor has touched the toggle, so
   * the overwhelming majority of real content carries no meta key at all. Under
   * `=== true` every one of those fields becomes hidden and effectively the whole
   * site disappears — every section whose content predates the show/hide feature.
   * pixel-parity would catch the blank page on a PR, but only once someone has
   * built it; this names the invariant so nobody "simplifies" the operator.
   */
  it('is visible when the meta key is absent entirely', () => {
    expect(fieldVisible({ title: 'x' }, 'title')).toBe(true)
  })

  /**
   * Bug it would catch: the same flip, in the case that is easiest to overlook —
   * a group with no meta keys whatsoever, which is what most committed content is.
   */
  it('is visible for a group carrying no meta at all', () => {
    expect(fieldVisible({}, 'title')).toBe(true)
  })

  /**
   * Bug it would catch: the guard being dropped so a null/undefined group throws.
   * Optional `content` props are normal here — several blocks self-source their
   * content and are rendered with no prop at all — and a throw in a helper this
   * widely called blanks the page (there is no error boundary; roadmap R18).
   */
  it('is visible for a missing group rather than throwing', () => {
    expect(fieldVisible(undefined, 'title')).toBe(true)
    expect(fieldVisible(null, 'title')).toBe(true)
  })

  /** Bug it would catch: the toggle not working at all — hidden fields rendering. */
  it('is hidden ONLY when the meta key is explicitly false', () => {
    expect(fieldVisible({ titleVisible: false }, 'title')).toBe(false)
  })

  /**
   * Bug it would catch: a truthiness check (`!!v`) replacing the identity check.
   * These values are not `false`, so every one of them must stay visible. An
   * editor who has never touched the toggle must not be able to hide a section by
   * accident, and the CMS has historically emitted several of these shapes.
   */
  it.each([
    ['explicit true', true],
    ['the string "false"', 'false'],
    ['zero', 0],
    ['an empty string', ''],
    ['null', null],
  ])('stays visible for %s', (_label, value) => {
    expect(fieldVisible({ titleVisible: value }, 'title')).toBe(true)
  })

  /** Bug it would catch: the `<name>Visible` key convention being mis-built. */
  it('reads the sibling `<name>Visible` key, not the field itself', () => {
    const group = { title: 'shown', titleVisible: false, subtitleVisible: true }
    expect(fieldVisible(group, 'title')).toBe(false)
    expect(fieldVisible(group, 'subtitle')).toBe(true)
  })
})

describe('fieldLabel — `?? fallback`, not `|| fallback`', () => {
  /**
   * Bug it would catch: `?? fallback` changed to `|| fallback`.
   *
   * This is the exact inverse of the LanguageContext case, which is what makes it
   * so easy to get backwards. Here an EMPTY STRING is a real, intentional editor
   * choice: clearing a caption means "render no caption". `||` would treat that as
   * missing and silently restore the hardcoded default, so a caption the editor
   * deliberately removed reappears on the live site and no amount of re-clearing
   * it in the CMS makes it go away.
   */
  it('keeps an intentional empty caption instead of restoring the default', () => {
    const group = { sectionNumberLabel: { es: '', en: '' } }
    expect(fieldLabel(group, 'sectionNumber', 'es', '02')).toBe('')
  })

  /** Bug it would catch: the fallback never being applied — captions vanishing. */
  it('falls back when the label is absent', () => {
    expect(fieldLabel({}, 'sectionNumber', 'es', '02')).toBe('02')
  })

  /**
   * Bug it would catch: the fallback not applying per-locale. A caption written in
   * Spanish and never translated must fall back to the hardcoded default in
   * English, not render blank.
   */
  it('falls back per locale, not per label', () => {
    const group = { sectionNumberLabel: { es: 'Dos' } }
    expect(fieldLabel(group, 'sectionNumber', 'es', '02')).toBe('Dos')
    expect(fieldLabel(group, 'sectionNumber', 'en', '02')).toBe('02')
  })

  /**
   * Bug it would catch: `null` being treated as a value. Payload writes `null` for
   * a localized field that exists but has never been given content in that locale
   * — distinct from an editor clearing it to `''` — and it must take the default.
   */
  it('falls back for an explicit null', () => {
    const group = { sectionNumberLabel: { es: null, en: null } }
    expect(fieldLabel(group, 'sectionNumber', 'es', '02')).toBe('02')
  })

  /** Bug it would catch: the same missing-group throw as fieldVisible's. */
  it('falls back for a missing group rather than throwing', () => {
    expect(fieldLabel(undefined, 'sectionNumber', 'es', '02')).toBe('02')
    expect(fieldLabel(null, 'sectionNumber', 'en', '02')).toBe('02')
  })
})

describe('the curried helpers', () => {
  /**
   * Bug it would catch: the curried forms drifting from the functions they wrap.
   * Renderers bind these once per block and then call them for every field, so a
   * divergence would apply to a whole section at a time rather than one field.
   */
  it('fieldVisibleFor matches fieldVisible', () => {
    const group = { titleVisible: false, subtitle: 'x' }
    const vis = fieldVisibleFor(group)

    expect(vis('title')).toBe(fieldVisible(group, 'title'))
    expect(vis('subtitle')).toBe(fieldVisible(group, 'subtitle'))
  })

  it('fieldLabelFor matches fieldLabel, binding the language', () => {
    const group = { ctaLabel: { es: 'Ver', en: '' } }
    const lbl = fieldLabelFor(group, 'en')

    expect(lbl('cta', 'View')).toBe(fieldLabel(group, 'cta', 'en', 'View'))
    // ...and the bound language is the one that is used: `en` is empty, and an
    // intentional empty caption survives.
    expect(lbl('cta', 'View')).toBe('')
  })
})
