import type { GlobalConfig } from 'payload'

/**
 * Mirrors content/career.json.
 *
 * JSON shape:
 * {
 *   "headings": {
 *     "careerPath": {es,en},                 // localized
 *     "professionalExperience": {es,en}      // localized
 *   },
 *   "experience": {
 *     "es": [ { role, period, responsibilities:[...] }, ... ],
 *     "en": [ { role, period, responsibilities:[...] }, ... ]
 *   }
 * }
 *
 * MODELING CHOICE for `experience` (JSON is a per-language ARRAY of objects):
 * `role`, `period`, and each `responsibilities` item are all bilingual in the JSON
 * (parallel `es`/`en` arrays with matching indices). We model a single `experience`
 * array of rows; each row has:
 *   - role   (text, localized)
 *   - period (text, localized)  -- periods happen to be identical across locales but
 *                                  the JSON stores them per-language, so we keep it localized
 *                                  to round-trip both es and en arrays.
 *   - responsibilities: nested array of { item: text (localized) }
 * With ?locale=all a fetch script pivots this into { es:[...], en:[...] } by reading
 * the .es / .en of each localized field per row. Row ordering is preserved and shared
 * across locales (the source es/en arrays are index-parallel).
 */
export const Career: GlobalConfig = {
  slug: 'career',
  label: 'Experiencia Laboral',
  // Content is public: the front-end build reads it over the REST API without
  // auth. Update stays auth'd (Payload's default when unset).
  access: {
    read: () => true,
  },
  admin: {
    // Superseded by the inline Experiencia block on the home Página.
    // Hidden from the admin; kept in schema to avoid a destructive table drop.
    hidden: true,
    group: 'Páginas y Contenido',
    description: 'Tu trayectoria profesional (el acordeón de experiencia).',
  },
  fields: [
    {
      type: 'group',
      name: 'headings',
      label: 'Títulos',
      admin: { description: 'Títulos que encabezan la sección de experiencia.' },
      fields: [
        {
          name: 'careerPath',
          type: 'text',
          localized: true,
          label: 'Título "Trayectoria"',
        },
        {
          name: 'professionalExperience',
          type: 'text',
          localized: true,
          label: 'Título "Experiencia profesional"',
        },
      ],
    },
    {
      name: 'experience',
      type: 'array',
      label: 'Experiencia',
      labels: { singular: 'Puesto', plural: 'Puestos' },
      admin: {
        description:
          'Cada puesto de trabajo. Se muestran en orden, del primero al último.',
      },
      fields: [
        {
          name: 'role',
          type: 'text',
          localized: true,
          label: 'Puesto / cargo',
        },
        {
          name: 'period',
          type: 'text',
          localized: true,
          label: 'Periodo (fechas)',
        },
        {
          name: 'responsibilities',
          type: 'array',
          label: 'Responsabilidades',
          labels: { singular: 'Responsabilidad', plural: 'Responsabilidades' },
          admin: {
            description: 'Cada punto de lo que hacías en este puesto.',
          },
          fields: [
            { name: 'item', type: 'text', localized: true, label: 'Punto' },
          ],
        },
      ],
    },
  ],
}
