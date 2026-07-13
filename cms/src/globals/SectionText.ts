import type { GlobalConfig } from 'payload'

/**
 * Mirrors the TEXT (non-project-array) portions of the section JSON files:
 *   content/sections/web-apps.json     -> webApps
 *   content/sections/branding.json     -> branding
 *   content/sections/photography.json  -> photography
 *   content/sections/marketing-360.json-> marketing360
 *   content/sections/uxui.json         -> uxui
 *
 * The project card ARRAYS (home.projects / page.projects / branding image groups)
 * are intentionally NOT modeled here — they live in the `projects` collection.
 * Only the surrounding section text is captured.
 *
 * Field names mirror the JSON keys as closely as possible. Bilingual {es,en}
 * values are `localized: true`; language-agnostic values (studioName, image paths)
 * are not. With ?locale=all localized fields return { es, en }, matching the JSON.
 */
export const SectionText: GlobalConfig = {
  slug: 'section-text',
  admin: { group: 'Content' },
  fields: [
    // --- web-apps.json ---
    {
      type: 'group',
      name: 'webApps',
      fields: [
        {
          type: 'group',
          name: 'home',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
            { name: 'studioName', type: 'text' }, // language-agnostic
            { name: 'roleDescription', type: 'textarea', localized: true },
            { name: 'cta', type: 'text', localized: true },
          ],
        },
        {
          type: 'group',
          name: 'page',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
          ],
        },
      ],
    },

    // --- branding.json ---
    {
      type: 'group',
      name: 'branding',
      fields: [
        {
          type: 'group',
          name: 'home',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
            { name: 'studioName', type: 'text' },
            { name: 'roleDescription', type: 'textarea', localized: true },
            { name: 'cta', type: 'text', localized: true },
            { name: 'sectionHeading', type: 'text', localized: true },
          ],
        },
        {
          type: 'group',
          name: 'page',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
            { name: 'subtitleSports', type: 'text', localized: true },
            { name: 'subtitleBeauty', type: 'text', localized: true },
          ],
        },
      ],
    },

    // --- photography.json ---
    {
      type: 'group',
      name: 'photography',
      fields: [
        {
          type: 'group',
          name: 'home',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
            { name: 'studioName', type: 'text' },
            { name: 'roleDescription', type: 'textarea', localized: true },
            { name: 'cta', type: 'text', localized: true },
          ],
        },
        {
          type: 'group',
          name: 'page',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
          ],
        },
      ],
    },

    // --- marketing-360.json ---
    {
      type: 'group',
      name: 'marketing360',
      fields: [
        {
          type: 'group',
          name: 'home',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
            { name: 'studioName', type: 'text' },
            { name: 'roleDescription', type: 'textarea', localized: true },
            { name: 'cta', type: 'text', localized: true },
          ],
        },
        {
          type: 'group',
          name: 'page',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
          ],
        },
      ],
    },

    // --- uxui.json (home only; the full case study lives in the CaseStudy global) ---
    {
      type: 'group',
      name: 'uxui',
      fields: [
        {
          type: 'group',
          name: 'home',
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'tagline', type: 'text', localized: true },
            { name: 'description', type: 'textarea', localized: true },
            { name: 'studioName', type: 'text' },
            { name: 'roleDescription', type: 'textarea', localized: true },
            { name: 'sketchImage', type: 'text' }, // language-agnostic path
            { name: 'sketchAlt', type: 'text', localized: true },
            { name: 'cta', type: 'text', localized: true },
          ],
        },
      ],
    },
  ],
}
