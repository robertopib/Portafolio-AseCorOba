import type { GlobalConfig } from 'payload'
import { triggerDeployGlobalAfterChange } from '../hooks/triggerDeploy'

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
  label: 'Sobre Mí y Contacto',
  // Content is public: the front-end build reads it over the REST API without
  // auth. Update stays auth'd (Payload's default when unset).
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [triggerDeployGlobalAfterChange],
  },
  admin: {
    // Superseded by the inline About/Contact blocks on the home Página.
    // Hidden from the admin; kept in schema to avoid a destructive table drop.
    hidden: true,
    group: 'Páginas y Contenido',
    description:
      'Formación, herramientas, idiomas, datos de contacto y pie de página.',
  },
  fields: [
    {
      type: 'group',
      name: 'headings',
      label: 'Títulos de las secciones',
      admin: {
        description:
          'Los títulos que encabezan cada bloque en la página "Sobre mí".',
      },
      fields: [
        {
          name: 'education',
          type: 'text',
          localized: true,
          label: 'Título de Formación',
        },
        {
          name: 'tools',
          type: 'text',
          localized: true,
          label: 'Título de Herramientas',
        },
        {
          name: 'languages',
          type: 'text',
          localized: true,
          label: 'Título de Idiomas',
        },
      ],
    },
    // education: array of localized items (see modeling note above).
    {
      name: 'education',
      type: 'array',
      label: 'Formación',
      labels: { singular: 'Estudio', plural: 'Estudios' },
      admin: {
        description: 'Lista de tu formación académica (una línea por estudio).',
      },
      fields: [
        { name: 'item', type: 'text', localized: true, label: 'Estudio' },
      ],
    },
    // tools: language-agnostic list of strings.
    {
      name: 'tools',
      type: 'array',
      label: 'Herramientas',
      labels: { singular: 'Herramienta', plural: 'Herramientas' },
      admin: {
        description:
          'Programas y herramientas que usas (igual en ambos idiomas).',
      },
      fields: [{ name: 'value', type: 'text', label: 'Herramienta' }],
    },
    // languages: language-agnostic list of strings.
    {
      name: 'languages',
      type: 'array',
      label: 'Idiomas',
      labels: { singular: 'Idioma', plural: 'Idiomas' },
      admin: {
        description: 'Idiomas que hablas y tu nivel (igual en ambos idiomas).',
      },
      fields: [{ name: 'value', type: 'text', label: 'Idioma' }],
    },
    {
      type: 'group',
      name: 'contact',
      label: 'Contacto',
      admin: { description: 'Bloque de contacto de la página.' },
      fields: [
        {
          name: 'heading',
          type: 'text',
          localized: true,
          label: 'Título de contacto',
        },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
          label: 'Texto de contacto',
        },
        {
          name: 'email',
          type: 'text',
          label: 'Correo electrónico',
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Teléfono',
        },
      ],
    },
    // socialLinks: language-agnostic { name, url } list.
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Redes sociales',
      labels: { singular: 'Red social', plural: 'Redes sociales' },
      admin: {
        description: 'Enlaces a tus redes sociales (igual en ambos idiomas).',
      },
      fields: [
        { name: 'name', type: 'text', label: 'Nombre (p. ej. Instagram)' },
        { name: 'url', type: 'text', label: 'Enlace (URL)' },
      ],
    },
    {
      type: 'group',
      name: 'footer',
      label: 'Pie de página',
      admin: {
        description: 'Textos del pie de página (aparece en todas las páginas).',
      },
      fields: [
        {
          name: 'copyrightPrefix',
          type: 'text',
          label: 'Texto de copyright',
        },
        {
          name: 'rights',
          type: 'text',
          localized: true,
          label: 'Derechos reservados',
        },
        {
          name: 'privacy',
          type: 'text',
          localized: true,
          label: 'Privacidad',
        },
        {
          name: 'terms',
          type: 'text',
          localized: true,
          label: 'Términos',
        },
      ],
    },
  ],
}
