import type { GlobalConfig } from 'payload'

/**
 * Mirrors content/about.json.
 *
 * JSON shape:
 * {
 *   "headings": { education:{es,en}, tools:{es,en}, languages:{es,en} },  // localized
 *   "education": { es:[...], en:[...] },  // per-language ARRAY of strings
 *   "tools": [ "Adobe Illustrator", ... ],     // language-agnostic array
 *   "languages": [ "Español – Nativo", ... ],  // language-agnostic array
 *   "contact": {
 *     "heading": {es,en}, "body": {es,en},      // localized
 *     "email": "...", "phone": "..."            // language-agnostic
 *   },
 *   "socialLinks": [ { name, url } ],           // language-agnostic
 *   "footer": {
 *     "copyrightPrefix": "...",                 // language-agnostic
 *     "rights": {es,en}, "privacy": {es,en}, "terms": {es,en}  // localized
 *   }
 * }
 *
 * MODELING CHOICE for `education` (JSON is { es:[...], en:[...] }):
 * modeled as an array field whose each row holds a single `item` text that is
 * `localized: true`. With ?locale=all each row's `item` returns { es, en }, so
 * a fetch script can pivot rows -> { es: rows.map(r=>r.item.es), en: rows.map(r=>r.item.en) }.
 * This preserves ordering and item count across both locales (they are parallel here).
 */
export const About: GlobalConfig = {
  slug: 'about',
  admin: { group: 'Content' },
  fields: [
    {
      type: 'group',
      name: 'headings',
      fields: [
        { name: 'education', type: 'text', localized: true },
        { name: 'tools', type: 'text', localized: true },
        { name: 'languages', type: 'text', localized: true },
      ],
    },
    // education: array of localized items (see modeling note above).
    {
      name: 'education',
      type: 'array',
      fields: [{ name: 'item', type: 'text', localized: true }],
    },
    // tools: language-agnostic list of strings.
    {
      name: 'tools',
      type: 'array',
      fields: [{ name: 'value', type: 'text' }],
    },
    // languages: language-agnostic list of strings.
    {
      name: 'languages',
      type: 'array',
      fields: [{ name: 'value', type: 'text' }],
    },
    {
      type: 'group',
      name: 'contact',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        { name: 'body', type: 'textarea', localized: true },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
      ],
    },
    // socialLinks: language-agnostic { name, url } list.
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      type: 'group',
      name: 'footer',
      fields: [
        { name: 'copyrightPrefix', type: 'text' },
        { name: 'rights', type: 'text', localized: true },
        { name: 'privacy', type: 'text', localized: true },
        { name: 'terms', type: 'text', localized: true },
      ],
    },
  ],
}
