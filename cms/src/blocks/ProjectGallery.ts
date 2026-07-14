import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * ProjectGallery block — selects which project cards to render and how.
 *
 * `source`:
 *   - 'by-filter': pull projects from the `projects` collection matching
 *     section / placement / group (mirrors Projects.ts field options).
 *   - 'manual': hand-pick specific project documents.
 * `layoutVariant` maps to the existing per-page grid CSS on the front end.
 */
export const ProjectGallery: Block = {
  slug: 'projectGallery',
  interfaceName: 'ProjectGalleryBlock',
  labels: {
    singular: 'Galería de proyectos',
    plural: 'Galerías de proyectos',
  },
  fields: [
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'by-filter',
      label: 'Origen de los proyectos',
      admin: {
        description: '¿Cómo eliges las imágenes que se muestran?',
      },
      options: [
        { label: 'Por filtro (automático)', value: 'by-filter' },
        { label: 'Selección manual', value: 'manual' },
        { label: 'Selección manual con tamaños (mosaico)', value: 'items' },
      ],
    },
    // --- by-filter ---
    {
      name: 'section',
      type: 'select',
      label: 'Página / sección',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'by-filter',
        description: '¿De qué sección tomar las imágenes?',
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
      label: 'Dónde se muestra',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'by-filter',
        description: 'Filtra por el campo "Dónde se muestra" de cada proyecto.',
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
      label: 'Grupo',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'by-filter',
        description:
          'Opcional. Solo para Branding: subgrupo (p. ej. deportes, belleza, logos).',
      },
    },
    // --- manual (simple, equal-size cards) ---
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: 'Proyectos',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
        description:
          'Elige a mano las tarjetas de proyecto que quieres mostrar (todas del mismo tamaño).',
      },
    },
    // --- manual with per-card size (masonry parity) ---
    {
      name: 'items',
      type: 'array',
      label: 'Proyectos con tamaño',
      labels: { singular: 'Tarjeta', plural: 'Tarjetas' },
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'items',
        description:
          'Elige cada tarjeta y su tamaño en el mosaico (para reproducir el diseño exacto).',
      },
      fields: [
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          required: true,
          label: 'Proyecto',
        },
        {
          name: 'size',
          type: 'select',
          required: true,
          defaultValue: 'normal',
          label: 'Tamaño en el mosaico',
          admin: {
            description: 'El tamaño/espacio que ocupa esta tarjeta en la cuadrícula.',
          },
          options: [
            { label: 'Normal (2 col)', value: 'normal' },
            { label: 'Media (3 col)', value: 'col3' },
            { label: 'Ancha (4 col)', value: 'col4' },
            { label: 'Hero (4 col x 2 filas)', value: 'hero' },
            { label: 'Ancha alta (3 col x 2 filas)', value: 'wide-tall' },
            { label: 'Ancha alta (5 col x 2 filas)', value: 'wide5-tall' },
            { label: 'Alta (2 col x 2 filas)', value: 'tall' },
            { label: 'Media 1 fila (2 col x 1 fila)', value: 'med' },
          ],
        },
      ],
    },
    // --- layout ---
    {
      name: 'layoutVariant',
      type: 'select',
      required: true,
      defaultValue: 'grid-3',
      label: 'Diseño de la cuadrícula',
      admin: {
        description: 'Cómo se distribuyen las tarjetas.',
      },
      options: [
        { label: 'Cuadrícula de 3', value: 'grid-3' },
        { label: 'Cuadrícula de 4', value: 'grid-4' },
        { label: 'Una sola imagen', value: 'single' },
        { label: 'Mosaico — Fotografía (inicio)', value: 'masonry-photo' },
        { label: 'Mosaico — 6 columnas', value: 'masonry-6' },
        { label: 'Mosaico — 8 columnas', value: 'masonry-8' },
        { label: 'Mosaico — 10 columnas', value: 'masonry-10' },
      ],
    },
    anchorField,
  ],
}
