import type { CollectionConfig } from 'payload'
import { triggerDeployAfterChange, triggerDeployAfterDelete } from '../hooks/triggerDeploy'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Imagen',
    plural: 'Biblioteca de Imágenes',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [triggerDeployAfterChange],
    afterDelete: [triggerDeployAfterDelete],
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Portafolio',
    description:
      'Todas las imágenes subidas. Sube aquí una imagen antes de usarla en un proyecto.',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      label: 'Texto alternativo',
      admin: {
        description:
          'Breve descripción de la imagen (para accesibilidad). Sirve también como nombre en la biblioteca.',
      },
    },
  ],
  upload: true,
}
