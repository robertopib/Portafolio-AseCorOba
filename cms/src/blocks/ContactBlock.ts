import type { Block } from 'payload'

import { anchorField } from './fields/anchor'

/**
 * ContactBlock — mirrors About.contact + About.socialLinks + About.footer.
 * Bilingual texts localized; email/phone/urls language-agnostic.
 */
export const ContactBlock: Block = {
  slug: 'contact',
  interfaceName: 'ContactBlock',
  labels: {
    singular: 'Contacto',
    plural: 'Bloques de contacto',
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: 'Título de contacto' },
    { name: 'body', type: 'textarea', localized: true, label: 'Texto de contacto' },
    { name: 'email', type: 'text', label: 'Correo electrónico' },
    { name: 'phone', type: 'text', label: 'Teléfono' },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Redes sociales',
      labels: { singular: 'Red social', plural: 'Redes sociales' },
      fields: [
        { name: 'name', type: 'text', label: 'Nombre (p. ej. Instagram)' },
        { name: 'url', type: 'text', label: 'Enlace (URL)' },
      ],
    },
    {
      type: 'group',
      name: 'footer',
      label: 'Pie de página',
      fields: [
        { name: 'copyrightPrefix', type: 'text', label: 'Texto de copyright' },
        { name: 'rights', type: 'text', localized: true, label: 'Derechos reservados' },
        { name: 'privacy', type: 'text', localized: true, label: 'Privacidad' },
        { name: 'terms', type: 'text', localized: true, label: 'Términos' },
      ],
    },
    anchorField,
  ],
}
