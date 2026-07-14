import type { Field } from 'payload'

/**
 * Shared optional anchor-id field, spread into every block's `fields` so each
 * block can be linked to from the site menu (rendered as the section's html id
 * by the front-end later). Kept language-agnostic — an id is the same in every
 * locale.
 */
export const anchorField: Field = {
  name: 'anchorId',
  type: 'text',
  label: 'ID de ancla (opcional)',
  admin: {
    description:
      "Para enlazar a esta sección desde el menú, p.ej. 'branding'.",
  },
}
