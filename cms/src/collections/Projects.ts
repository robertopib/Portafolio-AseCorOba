import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'section', 'placement', 'group', 'order'],
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'section',
      type: 'select',
      required: true,
      options: [
        { label: 'Branding', value: 'branding' },
        { label: 'Web Apps', value: 'web-apps' },
        { label: 'UX/UI Producto', value: 'uxui-producto' },
        { label: 'Fotografia Producto', value: 'fotografia-producto' },
        { label: 'Marketing 360', value: 'marketing-360' },
      ],
    },
    {
      name: 'placement',
      type: 'select',
      required: true,
      options: [
        { label: 'Home', value: 'home' },
        { label: 'Page', value: 'page' },
        { label: 'Both', value: 'both' },
      ],
    },
    {
      name: 'group',
      type: 'text',
      admin: {
        description:
          'Optional. Used for branding sub-groups: sports, adrianaMunoz, anaGrace, logos.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      admin: {
        description: 'Used for sorting within a section/group.',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'alt',
      type: 'text',
      localized: true,
    },
    {
      name: 'category',
      type: 'text',
      localized: true,
    },
  ],
}
