import type { CollectionConfig } from 'payload'

/**
 * Categorías — the top level of the portfolio domain model.
 * Each Categoría groups a set of Proyectos and can be shown on the home page
 * via a "Category Showcase" block.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Portafolio',
    description:
      'Las categorías del portafolio (p. ej. Branding, Web y Apps). Agrupan los proyectos.',
    defaultColumns: ['name', 'slug', 'anchorId', 'order'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      label: 'Nombre',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
      label: 'Dirección (slug)',
      admin: {
        description: "dirección de la categoría, p.ej. 'branding'",
      },
    },
    {
      name: 'anchorId',
      type: 'text',
      required: true,
      label: 'ID de ancla',
      admin: {
        description: "ID para enlaces de ancla en el menú, p.ej. 'branding'",
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      label: 'Introducción',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Orden',
      admin: {
        description: 'Número para ordenar las categorías (el menor aparece primero).',
      },
    },
  ],
}
