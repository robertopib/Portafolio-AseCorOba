import type { GlobalConfig } from 'payload'

/**
 * Sitio y Navegación — the website title (browser tab), the brand name shown
 * top-left, and the editable main navigation menu.
 *
 * Emitted to content/site.json (read by src/app/components/Navigation.tsx).
 * Shape: { siteTitle:{es,en}, brand:{es,en}, navItems:[{ label:{es,en}, target }] }
 */
export const Site: GlobalConfig = {
  slug: 'site',
  label: 'Sitio y Navegación',
  admin: {
    group: 'Ajustes',
    description:
      'El título del sitio (pestaña del navegador), el nombre/marca de arriba y el menú de navegación.',
  },
  fields: [
    {
      name: 'siteTitle',
      type: 'text',
      localized: true,
      label: 'Título del sitio (pestaña del navegador)',
    },
    {
      name: 'brand',
      type: 'text',
      localized: true,
      label: 'Nombre / marca (arriba a la izquierda)',
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Menú de navegación',
      labels: { singular: 'Enlace', plural: 'Enlaces' },
      admin: {
        description: 'Arrastra para reordenar. Cada enlace: el texto visible y su destino.',
      },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'Texto' },
        {
          name: 'target',
          type: 'text',
          required: true,
          label: 'Destino',
          admin: {
            description: "Ancla o ruta, p. ej. #work (Proyectos), #about (Sobre mí), #contact (Contacto).",
          },
        },
      ],
    },
  ],
}
