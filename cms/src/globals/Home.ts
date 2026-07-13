import type { GlobalConfig } from 'payload'

/**
 * Mirrors content/home.json.
 *
 * JSON shape:
 * {
 *   "hero": {
 *     "backgroundImage": "/images/hero-background.jpg",   // language-agnostic path
 *     "title":    { es, en },                             // localized
 *     "subtitle": { es, en },                             // localized
 *     "body":     { es, en },                             // localized
 *     "cta1":     { es, en },                             // localized
 *     "cta2":     { es, en }                              // localized
 *   }
 * }
 *
 * Querying with ?locale=all returns each localized field as { es, en },
 * reproducing the exact JSON shape.
 */
export const Home: GlobalConfig = {
  slug: 'home',
  admin: { group: 'Content' },
  fields: [
    {
      type: 'group',
      name: 'hero',
      fields: [
        // Image path is language-agnostic -> NOT localized.
        { name: 'backgroundImage', type: 'text' },
        { name: 'title', type: 'text', localized: true },
        { name: 'subtitle', type: 'text', localized: true },
        { name: 'body', type: 'textarea', localized: true },
        { name: 'cta1', type: 'text', localized: true },
        { name: 'cta2', type: 'text', localized: true },
      ],
    },
  ],
}
