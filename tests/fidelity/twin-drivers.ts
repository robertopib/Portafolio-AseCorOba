/**
 * The two fakes that let one CMS state drive both content emitters offline
 * (R13b). Used by twin-equivalence.test.ts; no assertions live here.
 *
 * Each twin funnels every read through exactly one seam:
 *   - REST  (scripts/fetch-content.mjs)          — `getJson(url)`
 *   - Local (cms/src/scripts/export-emit.ts)     — the `payload` object's
 *                                                  `.find()` / `.findGlobal()`
 *
 * so replacing that one thing is enough to run the whole reconstruction with no
 * network, no database and no Payload boot.
 *
 * THE ASYMMETRY THIS MODELS. The twins are not symmetrical readers: the REST twin
 * fetches `pages` at depth 2 (fetch-content.mjs) and the Local twin at depth 0
 * (export-emit.ts). Both survive it because every relationship read is written
 * `typeof x === 'object' ? x.id : x`. If the fixture handed both sides the same
 * pre-shaped documents, that tolerance would go untested and a twin that lost one
 * of those guards would still pass. So the fixture stores relationships as ids
 * and `projectDepth()` populates them per request, exactly as Payload and the
 * REST API do.
 */
import { cmsState, RELATIONSHIPS, type CmsState } from '../fixtures/cms-state'

type Collection = keyof CmsState['collections']

const isCollection = (name: string): name is Collection =>
  Object.prototype.hasOwnProperty.call(cmsState.collections, name)

/**
 * Resolve relationship ids into embedded documents, `depth` levels deep — the
 * one behaviour of Payload/REST the reconstruction actually depends on.
 *
 * Deliberately shallow-minded: it walks blocks and top-level fields, which is
 * where this project's three relationships live (`grep -rn relationTo cms/src`).
 * It is not a general Payload emulator and should not grow into one.
 */
function projectDepth(state: CmsState, collection: Collection, doc: any, depth: number): any {
  if (depth <= 0) return doc
  const rels = RELATIONSHIPS[collection] || []
  const populate = (value: any, target: Collection) => {
    if (value == null || typeof value === 'object') return value
    const found = state.collections[target].find((d: any) => d.id === value)
    // An unresolvable id stays an id — same as Payload, and it keeps a fixture
    // typo from silently becoming `undefined` on one side only.
    return found ? projectDepth(state, target, found, depth - 1) : value
  }

  const out: any = { ...doc }
  for (const { field, collection: target } of rels) {
    if (field in out) out[field] = populate(out[field], target)
  }
  if (Array.isArray(out.blocks)) {
    out.blocks = out.blocks.map((b: any) => {
      const block = { ...b }
      for (const { field, collection: target } of rels) {
        if (field in block) block[field] = populate(block[field], target)
      }
      return block
    })
  }
  return out
}

/** `sort: 'slug'` is the only sort either twin asks for. */
function applySort(docs: any[], sort: string | undefined): any[] {
  if (!sort) return docs
  const desc = sort.startsWith('-')
  const key = desc ? sort.slice(1) : sort
  const sorted = [...docs].sort((a, b) => String(a[key]).localeCompare(String(b[key])))
  return desc ? sorted.reverse() : sorted
}

function read(
  state: CmsState,
  collection: string,
  { depth = 0, limit = 1000, sort }: { depth?: number; limit?: number; sort?: string },
): any[] {
  if (!isCollection(collection)) {
    throw new Error(`cms-state fixture has no '${collection}' collection`)
  }
  const docs = applySort(state.collections[collection], sort).slice(0, limit)
  return docs.map((d) => projectDepth(state, collection, d, depth))
}

function readGlobal(state: CmsState, slug: string): any {
  if (!(slug in state.globals)) throw new Error(`cms-state fixture has no '${slug}' global`)
  return state.globals[slug]
}

/**
 * The REST twin's seam. Answers the same URLs the real Payload REST API does:
 * `/api/globals/<slug>?...` returns the global document, `/api/<collection>?...`
 * returns a `{ docs: [...] }` envelope.
 */
export function makeRestGetJson(state: CmsState = cmsState) {
  return async (url: string): Promise<any> => {
    const parsed = new URL(url)
    const depth = Number(parsed.searchParams.get('depth') ?? 0)
    const limit = Number(parsed.searchParams.get('limit') ?? 1000)
    const sort = parsed.searchParams.get('sort') ?? undefined

    const globalMatch = parsed.pathname.match(/^\/api\/globals\/(.+)$/)
    if (globalMatch) return readGlobal(state, decodeURIComponent(globalMatch[1]))

    const collectionMatch = parsed.pathname.match(/^\/api\/(.+)$/)
    if (collectionMatch) {
      const docs = read(state, decodeURIComponent(collectionMatch[1]), { depth, limit, sort })
      return { docs, totalDocs: docs.length, page: 1, limit }
    }
    throw new Error(`fake REST API: unroutable URL ${url}`)
  }
}

/**
 * The Local twin's seam — enough of a Payload instance for the reconstruction,
 * and nothing more. `as any` because the real parameter types are Payload's
 * generic `CollectionSlug` unions, which are not reachable from the root project
 * (that is the whole reason this test can run in the `tests` CI job at all).
 */
export function makeLocalPayload(state: CmsState = cmsState) {
  return {
    find: async ({
      collection,
      depth = 0,
      limit = 1000,
      sort,
    }: {
      collection: string
      depth?: number
      limit?: number
      sort?: string
    }) => ({ docs: read(state, collection, { depth, limit, sort }) }),

    findGlobal: async ({ slug }: { slug: string }) => readGlobal(state, slug),
  } as any
}
