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
  label: 'Página de Inicio — Portada',
  // Content is public: the front-end build reads it over the REST API without
  // auth. Update stays auth'd (Payload's default when unset).
  access: {
    read: () => true,
  },
  admin: {
    // Superseded by the inline Hero block on the home Página (edit in place).
    // Hidden from the admin; kept in schema to avoid a destructive table drop.
    hidden: true,
    group: 'Páginas y Contenido',
    description:
      'El texto de la portada (la parte de arriba de la página de inicio).',
  },
  fields: [
    {
      type: 'group',
      name: 'hero',
      label: 'Portada',
      fields: [
        // Image path is language-agnostic -> NOT localized.
        {
          name: 'backgroundImage',
          type: 'text',
          label: 'Imagen de fondo (ruta)',
          admin: {
            description: 'Ruta del archivo de la imagen de fondo de la portada.',
          },
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: 'Título',
          admin: { description: 'El título grande de la portada.' },
        },
        {
          name: 'subtitle',
          type: 'text',
          localized: true,
          label: 'Subtítulo',
        },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
          label: 'Texto',
          admin: { description: 'Párrafo de introducción bajo el título.' },
        },
        {
          name: 'cta1',
          type: 'text',
          localized: true,
          label: 'Botón principal',
          admin: { description: 'Texto del primer botón.' },
        },
        {
          name: 'cta2',
          type: 'text',
          localized: true,
          label: 'Botón secundario',
          admin: { description: 'Texto del segundo botón.' },
        },
      ],
    },
  ],
}
