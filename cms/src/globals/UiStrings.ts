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
  label: 'Navegación y Etiquetas',
  admin: {
    group: 'Ajustes',
    description:
      "Textos del menú de navegación, botones y etiquetas generales. Cambia solo el 'valor', no la 'clave'.",
  },
  fields: [
    {
      name: 'strings',
      type: 'array',
      label: 'Textos',
      labels: { singular: 'Texto', plural: 'Textos' },
      admin: {
        description:
          "Cada fila es un texto de la web. Deja la 'Clave' como está y edita solo el 'Valor'.",
      },
      fields: [
        // Fixed identifier key, shared across locales -> NOT localized.
        {
          name: 'key',
          type: 'text',
          required: true,
          label: 'Clave (no cambiar)',
          admin: {
            description: 'Identificador técnico. No lo modifiques.',
          },
        },
        // Per-locale string value.
        {
          name: 'value',
          type: 'text',
          localized: true,
          label: 'Valor (el texto visible)',
          admin: {
            description: 'El texto que se muestra en la web. Este sí puedes cambiarlo.',
          },
        },
      ],
    },
  ],
}
