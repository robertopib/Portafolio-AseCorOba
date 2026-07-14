import type { CollectionConfig } from 'payload'

import { caseStudyBlocks } from '../blocks'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Proyecto',
    plural: 'Proyectos',
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Portafolio',
    description:
      'Los proyectos del portafolio. Cada uno es una imagen (galería/lightbox) o un caso de estudio con contenido.',
    defaultColumns: ['image', 'category', 'type', 'order', 'alt'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Categoría',
      admin: {
        description: 'La categoría del portafolio a la que pertenece este proyecto.',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'image',
      label: 'Tipo de proyecto',
      options: [
        { label: 'Solo imagen (galería/lightbox)', value: 'image' },
        { label: 'Caso de estudio (contenido)', value: 'caseStudy' },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Dirección (slug)',
      admin: {
        description: "para casos de estudio, p.ej. 'snaga'",
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Imagen',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      label: 'Orden',
      admin: {
        description:
          'Número para ordenar dentro de su grupo (el menor aparece primero).',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Título',
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
      label: 'Texto alternativo (accesibilidad)',
    },
    {
      name: 'categoryLabel',
      type: 'text',
      localized: true,
      label: 'Etiqueta en la tarjeta',
      admin: {
        description: 'La etiqueta pequeña de la tarjeta (p. ej. "Logo", "Social Media").',
      },
    },
    {
      name: 'caseStudyLayout',
      type: 'blocks',
      label: 'Contenido del caso de estudio',
      labels: { singular: 'Bloque', plural: 'Bloques' },
      admin: {
        description: 'Añade y ordena los bloques que forman el caso de estudio.',
        condition: (_, siblingData) => siblingData?.type === 'caseStudy',
      },
      blocks: caseStudyBlocks,
    },
    // --- Legacy fields (kept for the migration; will be pruned later) ---
    {
      name: 'section',
      type: 'select',
      label: 'Página (heredado)',
      admin: {
        description:
          'Campo heredado; la migración lo mapea a la Categoría. No usar para proyectos nuevos.',
      },
      options: [
        { label: 'Branding', value: 'branding' },
        { label: 'Web y Apps', value: 'web-apps' },
        { label: 'UX/UI Producto', value: 'uxui-producto' },
        { label: 'Fotografía de Producto', value: 'fotografia-producto' },
        { label: 'Marketing 360°', value: 'marketing-360' },
      ],
    },
    {
      name: 'placement',
      type: 'select',
      label: 'Dónde se muestra (heredado)',
      admin: {
        description: 'Campo heredado.',
      },
      options: [
        { label: 'Solo vista previa (inicio)', value: 'home' },
        { label: 'Solo página del proyecto', value: 'page' },
        { label: 'Ambas', value: 'both' },
      ],
    },
    {
      name: 'group',
      type: 'text',
      label: 'Grupo (heredado)',
      admin: {
        description:
          'Campo heredado. Solo para Branding: subgrupo (p. ej. deportes, belleza, logos).',
      },
    },
  ],
}
