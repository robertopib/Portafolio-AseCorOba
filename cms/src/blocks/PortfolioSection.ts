import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * PortfolioSection block — mirrors SectionText.<section>.home.
 * The homepage preview intro that sits above a group of project cards.
 */
export const PortfolioSection: Block = {
  slug: 'portfolioSection',
  interfaceName: 'PortfolioSectionBlock',
  labels: {
    singular: 'Introducción de sección (portafolio)',
    plural: 'Introducciones de sección (portafolio)',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      label: 'Título',
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: 'Descripción',
    },
    {
      name: 'studioName',
      type: 'text',
      label: 'Nombre del estudio',
      admin: { description: 'Igual en ambos idiomas.' },
    },
    {
      name: 'roleDescription',
      type: 'textarea',
      localized: true,
      label: 'Rol / descripción del rol',
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      label: 'Texto del botón',
    },
    {
      name: 'ctaHref',
      type: 'text',
      label: 'Enlace del botón (URL)',
      admin: { description: 'A dónde lleva el botón. Igual en ambos idiomas.' },
    },
    anchorField,
  ],
}
