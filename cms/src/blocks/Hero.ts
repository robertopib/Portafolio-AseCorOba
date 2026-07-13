import type { Block } from 'payload'

/**
 * Hero block — mirrors Home.hero.
 *
 * `backgroundImage` prefers an upload relationship to the media library, with an
 * optional text `backgroundImagePath` fallback for legacy path-based content
 * (content/home.json stores "/images/hero-background.jpg").
 */
export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Portada (Hero)',
    plural: 'Portadas (Hero)',
  },
  fields: [
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen de fondo',
      admin: {
        description: 'Imagen de fondo de la portada (elígela de la biblioteca).',
      },
    },
    {
      name: 'backgroundImagePath',
      type: 'text',
      label: 'Imagen de fondo (ruta, alternativa)',
      admin: {
        description:
          'Solo si no usas una imagen de la biblioteca: ruta del archivo, p. ej. /images/hero-background.jpg',
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
}
