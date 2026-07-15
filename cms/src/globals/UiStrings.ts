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
  label: 'Textos y Etiquetas Generales',
  // Content is public: the front-end build reads it over the REST API without
  // auth. Update stays auth'd (Payload's default when unset).
  access: {
    read: () => true,
  },
  admin: {
    group: 'Ajustes',
    description:
      "Textos cortos reutilizables de la web (botones como 'Ver mi trabajo', 'Volver al inicio', etiquetas). Se editan a mano aquí. El MENÚ del sitio NO está aquí — está en 'Menú de Navegación'.",
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
          label: 'Clave (no editable)',
          admin: {
            readOnly: true,
            description: 'Identificador técnico. Bloqueado a propósito para que no se pueda romper.',
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
