import type { GlobalConfig } from 'payload'

/**
 * Navigation — the site menu. An ordered `items` array; each item links either
 * to a Page document or to a custom URL. Item order = menu order.
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menú de Navegación',
  admin: {
    group: 'Páginas y Contenido',
    description: 'El menú principal del sitio. Ordena los enlaces arrastrándolos.',
  },
  fields: [
    {
      name: 'brand',
      type: 'text',
      localized: true,
      label: 'Nombre de la marca',
      admin: { description: 'El nombre que aparece a la izquierda del menú.' },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Enlaces del menú',
      labels: { singular: 'Enlace', plural: 'Enlaces' },
      admin: {
        description: 'Cada fila es un enlace del menú. El orden aquí es el orden en el menú.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          label: 'Texto del enlace',
        },
        {
          name: 'linkType',
          type: 'select',
          required: true,
          defaultValue: 'page',
          label: 'Tipo de enlace',
          options: [
            { label: 'Página del sitio', value: 'page' },
            { label: 'Enlace personalizado', value: 'custom' },
            { label: 'Ancla en la portada (p. ej. #work)', value: 'anchor' },
          ],
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          label: 'Página',
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === 'page',
          },
        },
        {
          name: 'url',
          type: 'text',
          label: 'Enlace (URL)',
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === 'custom',
          },
        },
        {
          name: 'anchor',
          type: 'text',
          label: 'Ancla (p. ej. #work)',
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === 'anchor',
            description: 'Salta a esta sección cuando ya estás en la portada.',
          },
        },
      ],
    },
  ],
}
