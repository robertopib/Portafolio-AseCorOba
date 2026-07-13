import type { Block } from 'payload'

/**
 * CTAButton — a call-to-action button. Label localized; href language-agnostic.
 */
export const CTAButton: Block = {
  slug: 'ctaButton',
  interfaceName: 'CTAButtonBlock',
  labels: {
    singular: 'Botón',
    plural: 'Botones',
  },
  fields: [
    { name: 'label', type: 'text', localized: true, label: 'Texto del botón' },
    { name: 'href', type: 'text', label: 'Enlace (URL)' },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      label: 'Estilo',
      options: [
        { label: 'Principal', value: 'primary' },
        { label: 'Secundario', value: 'secondary' },
        { label: 'Enlace', value: 'link' },
      ],
    },
  ],
}
