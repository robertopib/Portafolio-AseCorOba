import type { CollectionConfig } from 'payload'
import { meta } from '../blocks/fieldMeta'

/**
 * Categorías — the top level of the intuitive "Categorías → Proyectos" model.
 *
 * Each Categoría corresponds to one section of the site (branding, web-apps,
 * uxui-producto, fotografia-producto, marketing-360) and carries ALL the
 * presentation text that used to live in the SectionText global, split into:
 *   - `home`: the copy shown in the home-page preview of this section
 *            (content/sections/*.json -> "home" keys, minus the project cards)
 *   - `page`: the copy shown at the top of this section's project page
 *            (content/sections/*.json -> "page" keys, minus the project cards)
 *
 * Not every category uses every field (only branding has sectionHeading /
 * subtitleSports / subtitleBeauty; only uxui has tagline / sketchImage /
 * sketchAlt). Unused fields simply stay empty and are omitted on export.
 *
 * Bilingual {es,en} values are `localized: true`; language-agnostic values
 * (studioName, image paths) are not. With ?locale=all localized fields return
 * { es, en }, matching the JSON.
 *
 * `slug`, `anchorId` and `order` are CMS-organizational only and do NOT appear
 * in any content JSON.
 */
const HOME_NOTE = 'Se muestra en la vista previa de esta categoría en la página de inicio.'
const PAGE_NOTE = 'Se muestra arriba de la página de esta categoría.'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  // Content is public: the front-end build reads it over the REST API without
  // auth. Create/update/delete stay auth'd (Payload's default when unset).
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Portafolio',
    description:
      'Las grandes áreas del portafolio (Branding, Web y Apps, UX/UI, Fotografía, 360°). Cada una agrupa sus proyectos y controla los textos de introducción.',
    defaultColumns: ['name', 'slug', 'order'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      label: 'Nombre',
      admin: { description: 'El nombre de la categoría (se usa como título).' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Identificador (slug)',
      admin: {
        description:
          'Identificador técnico único (p. ej. "branding"). No cambiar salvo que sepas lo que haces.',
      },
    },
    {
      name: 'anchorId',
      type: 'text',
      label: 'Ancla (anchor)',
      admin: {
        description: 'El ancla de la página a la que se salta al hacer clic (uso técnico).',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      label: 'Orden',
      admin: {
        description: 'Número para ordenar las categorías (el menor aparece primero).',
      },
    },

    // ---------- HOME preview text ----------
    {
      type: 'group',
      name: 'home',
      label: 'Vista previa en inicio',
      admin: { description: HOME_NOTE },
      fields: [
        ...meta({ name: 'heading', type: 'text', localized: true, label: 'Título' }, 'Título'),
        ...meta(
          {
            name: 'tagline',
            type: 'text',
            localized: true,
            label: 'Lema (tagline)',
            admin: { description: 'Solo UX/UI: el lema bajo el título.' },
          },
          'Lema',
        ),
        ...meta({ name: 'description', type: 'textarea', localized: true, label: 'Descripción' }, 'Descripción'),
        ...meta({ name: 'studioName', type: 'text', label: 'Nombre del estudio' }, 'Nombre del estudio'), // language-agnostic
        ...meta({ name: 'roleDescription', type: 'textarea', localized: true, label: 'Rol / descripción del rol' }, 'Rol'),
        ...meta({ name: 'cta', type: 'text', localized: true, label: 'Texto del botón' }, 'Texto del botón'),
        ...meta(
          {
            name: 'sectionHeading',
            type: 'text',
            localized: true,
            label: 'Título de la sección',
            admin: { description: 'Solo Branding: el título "Proyectos".' },
          },
          'Título de la sección',
        ),
        ...meta(
          {
            name: 'sketchImage',
            type: 'text',
            label: 'Imagen del boceto (ruta)',
            admin: { description: 'Solo UX/UI: ruta de la imagen del boceto.' },
          },
          'Imagen del boceto',
        ),
        ...meta(
          {
            name: 'sketchAlt',
            type: 'text',
            localized: true,
            label: 'Texto alternativo del boceto',
            admin: { description: 'Solo UX/UI.' },
          },
          'Texto alternativo del boceto',
        ),
      ],
    },

    // ---------- PAGE header text ----------
    {
      type: 'group',
      name: 'page',
      label: 'Página de la categoría',
      admin: { description: PAGE_NOTE },
      fields: [
        ...meta({ name: 'title', type: 'text', localized: true, label: 'Título' }, 'Título'),
        ...meta({ name: 'description', type: 'textarea', localized: true, label: 'Descripción' }, 'Descripción'),
        ...meta(
          {
            name: 'subtitleSports',
            type: 'text',
            localized: true,
            label: 'Subtítulo "Deportes"',
            admin: { description: 'Solo Branding.' },
          },
          'Subtítulo "Deportes"',
        ),
        ...meta(
          {
            name: 'subtitleBeauty',
            type: 'text',
            localized: true,
            label: 'Subtítulo "Belleza"',
            admin: { description: 'Solo Branding.' },
          },
          'Subtítulo "Belleza"',
        ),
      ],
    },
  ],
}
