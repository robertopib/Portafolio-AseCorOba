/**
 * Field-meta companions: per-field "show/hide on the site" toggle and an editable
 * "visible label" (caption) — shared by Categories, contentFields and
 * caseStudyBody so the three schema sites define the convention ONCE.
 *
 * WHY companions instead of runtime-editable admin labels: Payload's built-in
 * field `label` is static config baked into the admin bundle; making it
 * editor-renamable would need ~150 fragile custom Field components. Instead each
 * field gets FLAT sibling columns:
 *   - `<name>Visible`  checkbox, defaultValue true, NOT localized — the front-end
 *                      renders the field only when it is !== false.
 *   - `<name>Label`    localized text — the caption the site shows for this field.
 *                      Added ONLY to fields that render a caption/heading today
 *                      (value fields ARE the visible text and get no second label).
 *
 * FLAT (not nested groups/arrays) on purpose: a checkbox is one bool column and a
 * localized text is one column on the existing `_locales` table, so NO new tables
 * are created and the Postgres 63-char table-name limit is untouched. `group`
 * fields flatten into the parent, so the longest resulting column stays well under
 * 63 (worst case ~ `caseStudy_journey_labels_frictionVisible`, 40 chars).
 *
 * Export/fetch pass these siblings straight through into content JSON as flat
 * keys (`titleVisible`, `sectionNumberLabel`, …). The front-end reads them via the
 * helpers in `src/app/blocks/contentMeta.ts`. Flat sibling keys also avoid
 * colliding with existing content sub-groups (e.g. the case study already has a
 * content group literally named `labels` at `journey.labels`).
 */
import type { Field } from 'payload'

/** The `<name>Visible` checkbox companion (agnostic, default shown). */
export const visibleField = (name: string, human: string): Field => ({
  name: `${name}Visible`,
  type: 'checkbox',
  defaultValue: true,
  label: `Mostrar «${human}» en el sitio`,
  admin: {
    description: 'Desmarca esta casilla para ocultar este elemento en el sitio público.',
  },
})

/** The `<name>Label` localized caption companion (only for caption fields). */
export const labelField = (name: string, human: string): Field => ({
  name: `${name}Label`,
  type: 'text',
  localized: true,
  label: `Etiqueta visible de «${human}»`,
  admin: {
    description: 'El texto de la etiqueta que se muestra en el sitio para este elemento.',
  },
})

/**
 * Wrap a base field with its companions, ready to spread into a group's `fields`:
 *   ...meta(t('title', 'Título'), 'Título')                 // toggle only
 *   ...meta(t('studioName', 'Estudio', false), 'Estudio', { label: true })  // + caption
 *
 * @param base    the existing field (must have a string `name`)
 * @param human   human-readable name used in the companion labels
 * @param opts    label: add the `<name>Label` caption (default false)
 *                visible: add the `<name>Visible` toggle (default true)
 */
export const meta = (
  base: Field,
  human: string,
  opts: { label?: boolean; visible?: boolean } = {},
): Field[] => {
  const name = (base as { name?: string }).name
  if (!name) throw new Error('meta() requires a field with a `name`')
  const out: Field[] = [base]
  if (opts.visible !== false) out.push(visibleField(name, human))
  if (opts.label) out.push(labelField(name, human))
  return out
}
