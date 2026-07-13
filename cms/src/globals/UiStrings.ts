import type { GlobalConfig } from 'payload'

/**
 * Mirrors content/ui.json.
 *
 * JSON shape: two locale objects, each ~65 flat key -> string pairs:
 * { "es": { "nav.home": "Inicio", ... }, "en": { "nav.home": "Home", ... } }
 *
 * MODELING CHOICE: an array `strings` of { key, value } where:
 *   - key   is a language-agnostic identifier (NOT localized), e.g. "nav.home"
 *   - value is localized -> ?locale=all yields { es, en }
 * A fetch script reconstructs ui.json by iterating rows:
 *   es[row.key] = row.value.es ; en[row.key] = row.value.en
 *
 * NOTE: The set of keys is driven by the frontend (see content/ui.json). Keys are
 * not enumerated in the schema on purpose; content editors / the seed script supply
 * the exact key list so it stays in sync with the frontend without a schema change.
 */
export const UiStrings: GlobalConfig = {
  slug: 'ui-strings',
  admin: { group: 'Content' },
  fields: [
    {
      name: 'strings',
      type: 'array',
      admin: {
        description:
          'Flat i18n key -> localized value pairs. The key list is driven by the frontend (content/ui.json).',
      },
      fields: [
        // Fixed identifier key, shared across locales -> NOT localized.
        { name: 'key', type: 'text', required: true },
        // Per-locale string value.
        { name: 'value', type: 'text', localized: true },
      ],
    },
  ],
}
