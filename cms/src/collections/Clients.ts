import type { CollectionConfig } from 'payload'

/**
 * Clientes — who the work was for. The third axis of the content model, added in R23b-i.
 *
 * THE ROOT-CAUSE FIX. Before this collection, "which project does this photo belong to" was
 * a prefix typed by hand into each row's title — and it drifted: `Ana Grace` and `Ana Grace
 * Salon & Estética` split one salon into two projects. A relationship cannot drift, and
 * renaming a client is now one edit instead of four.
 *
 * THREE AXES, NONE NESTED INSIDE ANOTHER (r23-target-model.md §3.6):
 *   - `Categoría` selects the public page
 *   - `Cliente`   names who the work was for   <- this file
 *   - `group`     selects a layout slot on the branding page
 *
 * A client's work spans several categorías, which is why Cliente cannot sit under Categoría.
 * `OFF DAY Trainer` is the live case: Branding *and* Web y Apps — one client, two proyectos,
 * because a proyecto belongs to exactly one categoría (owner decision 2).
 *
 * CMS-ONLY, AND THE SCHEMA SAYS SO. Note the absence of `access.read: () => true`, which both
 * `Categories` and `Projects` do declare: the front-end build reads those two over REST
 * without auth. Nothing fetches clients — neither content emitter mentions the word
 * (r23-target-model.md §4.1 proves it four ways). Leaving read auth'd is deliberate: it is
 * the schema-level statement that Cliente reaches no renderer, and it means a future
 * exporter change cannot start reading it without also changing access here.
 */
export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: {
    singular: 'Cliente',
    plural: 'Clientes',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Portafolio',
    description:
      'Las personas y marcas para las que se hizo el trabajo. Un cliente puede tener proyectos en varias categorías.',
    defaultColumns: ['name'],
  },
  defaultSort: 'name',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre',
      // NOT localized, on purpose: a client's name is the same in both languages, exactly
      // like `studioName` in Categories.ts:116. That is also what keeps a `clients_locales`
      // table out of the migration (r23-target-model.md §5.1).
      admin: {
        description: 'El nombre del cliente, tal y como quieres verlo en el panel.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notas',
      admin: {
        description: 'Notas internas sobre este cliente. No se muestran en la web.',
      },
    },
  ],
}
