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
// Reusable admin.description strings noting WHERE a field shows on the site.
const HOME_NOTE = "Se muestra en la vista previa de esta sección en la página de inicio."
const PAGE_NOTE = 'Se muestra arriba de la página de este proyecto.'

export const SectionText: GlobalConfig = {
  slug: 'section-text',
  label: 'Introducciones de Secciones',
  admin: {
    group: 'Páginas y Contenido',
    description:
      'Los títulos y textos que aparecen encima de cada grupo de proyectos (en la vista previa de la página de inicio y en las páginas de proyectos).',
  },
  fields: [
    // --- web-apps.json ---
    {
      type: 'group',
      name: 'webApps',
      label: 'Web y Apps',
      admin: {
        description: 'Controla los textos de la sección "Web y Apps".',
      },
      fields: [
        {
          type: 'group',
          name: 'home',
          label: 'Vista previa en inicio',
          admin: { description: HOME_NOTE },
          fields: [
            { name: 'heading', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
            { name: 'studioName', type: 'text', label: 'Nombre del estudio' }, // language-agnostic
            { name: 'roleDescription', type: 'textarea', localized: true, label: 'Rol / descripción del rol' },
            { name: 'cta', type: 'text', localized: true, label: 'Texto del botón' },
          ],
        },
        {
          type: 'group',
          name: 'page',
          label: 'Página del proyecto',
          admin: { description: PAGE_NOTE },
          fields: [
            { name: 'title', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
          ],
        },
      ],
    },

    // --- branding.json ---
    {
      type: 'group',
      name: 'branding',
      label: 'Branding',
      admin: {
        description: 'Controla los textos de la sección "Branding".',
      },
      fields: [
        {
          type: 'group',
          name: 'home',
          label: 'Vista previa en inicio',
          admin: { description: HOME_NOTE },
          fields: [
            { name: 'heading', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
            { name: 'studioName', type: 'text', label: 'Nombre del estudio' },
            { name: 'roleDescription', type: 'textarea', localized: true, label: 'Rol / descripción del rol' },
            { name: 'cta', type: 'text', localized: true, label: 'Texto del botón' },
            { name: 'sectionHeading', type: 'text', localized: true, label: 'Título de la sección' },
          ],
        },
        {
          type: 'group',
          name: 'page',
          label: 'Página del proyecto',
          admin: { description: PAGE_NOTE },
          fields: [
            { name: 'title', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
            { name: 'subtitleSports', type: 'text', localized: true, label: 'Subtítulo "Deportes"' },
            { name: 'subtitleBeauty', type: 'text', localized: true, label: 'Subtítulo "Belleza"' },
          ],
        },
      ],
    },

    // --- photography.json ---
    {
      type: 'group',
      name: 'photography',
      label: 'Fotografía de Producto',
      admin: {
        description: 'Controla los textos de la sección "Fotografía de Producto".',
      },
      fields: [
        {
          type: 'group',
          name: 'home',
          label: 'Vista previa en inicio',
          admin: { description: HOME_NOTE },
          fields: [
            { name: 'heading', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
            { name: 'studioName', type: 'text', label: 'Nombre del estudio' },
            { name: 'roleDescription', type: 'textarea', localized: true, label: 'Rol / descripción del rol' },
            { name: 'cta', type: 'text', localized: true, label: 'Texto del botón' },
          ],
        },
        {
          type: 'group',
          name: 'page',
          label: 'Página del proyecto',
          admin: { description: PAGE_NOTE },
          fields: [
            { name: 'title', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
          ],
        },
      ],
    },

    // --- marketing-360.json ---
    {
      type: 'group',
      name: 'marketing360',
      label: 'Marketing 360°',
      admin: {
        description: 'Controla los textos de la sección "Marketing 360°".',
      },
      fields: [
        {
          type: 'group',
          name: 'home',
          label: 'Vista previa en inicio',
          admin: { description: HOME_NOTE },
          fields: [
            { name: 'heading', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
            { name: 'studioName', type: 'text', label: 'Nombre del estudio' },
            { name: 'roleDescription', type: 'textarea', localized: true, label: 'Rol / descripción del rol' },
            { name: 'cta', type: 'text', localized: true, label: 'Texto del botón' },
          ],
        },
        {
          type: 'group',
          name: 'page',
          label: 'Página del proyecto',
          admin: { description: PAGE_NOTE },
          fields: [
            { name: 'title', type: 'text', localized: true, label: 'Título' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
          ],
        },
      ],
    },

    // --- uxui.json (home only; the full case study lives in the CaseStudy global) ---
    {
      type: 'group',
      name: 'uxui',
      label: 'UX/UI',
      admin: {
        description:
          'Controla los textos de la sección "UX/UI". (El contenido completo del caso de estudio está en "Caso de Estudio UX/UI".)',
      },
      fields: [
        {
          type: 'group',
          name: 'home',
          label: 'Vista previa en inicio',
          admin: { description: HOME_NOTE },
          fields: [
            { name: 'heading', type: 'text', localized: true, label: 'Título' },
            { name: 'tagline', type: 'text', localized: true, label: 'Lema (tagline)' },
            { name: 'description', type: 'textarea', localized: true, label: 'Descripción' },
            { name: 'studioName', type: 'text', label: 'Nombre del estudio' },
            { name: 'roleDescription', type: 'textarea', localized: true, label: 'Rol / descripción del rol' },
            { name: 'sketchImage', type: 'text', label: 'Imagen del boceto (ruta)' }, // language-agnostic path
            { name: 'sketchAlt', type: 'text', localized: true, label: 'Texto alternativo del boceto' },
            { name: 'cta', type: 'text', localized: true, label: 'Texto del botón' },
          ],
        },
      ],
    },
  ],
}
