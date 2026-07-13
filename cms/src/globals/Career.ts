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
  admin: { group: 'Content' },
  fields: [
    {
      type: 'group',
      name: 'headings',
      fields: [
        { name: 'careerPath', type: 'text', localized: true },
        { name: 'professionalExperience', type: 'text', localized: true },
      ],
    },
    {
      name: 'experience',
      type: 'array',
      fields: [
        { name: 'role', type: 'text', localized: true },
        { name: 'period', type: 'text', localized: true },
        {
          name: 'responsibilities',
          type: 'array',
          fields: [{ name: 'item', type: 'text', localized: true }],
        },
      ],
    },
  ],
}
