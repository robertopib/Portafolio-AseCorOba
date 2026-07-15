/**
 * Shared mapping tables between the committed frontend content JSON
 * (content/*.json, content/sections/*.json) and the Payload data model.
 *
 * Used by both seed.ts (write) and export-content.ts (read + reconstruct) so the
 * two stay perfectly in sync.
 *
 * DOMAIN MODEL (intuitive): Categorías -> Proyectos.
 *   - Each section JSON maps 1:1 to a Categoría. The Categoría holds ALL the
 *     non-project presentation text (the old SectionText content), split into a
 *     `home` group (home.* keys) and a `page` group (page.* keys).
 *   - Every project card in a section becomes a Proyecto (placement home|page).
 *   - The uxui case study becomes a single Proyecto (type='caseStudy') whose
 *     `caseStudy` group mirrors content/sections/uxui-casestudy.json.
 */
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// cms/src/scripts -> project root
export const ROOT = path.resolve(dirname, '..', '..', '..')
export const CONTENT_DIR = path.join(ROOT, 'content')
export const SECTIONS_DIR = path.join(CONTENT_DIR, 'sections')
export const IMAGES_DIR = path.join(ROOT, 'public', 'images')

export type Locale = 'es' | 'en'
export const LOCALES: Locale[] = ['es', 'en']

/** "/images/foo.png" -> "foo.png" */
export function pathToFilename(p: string): string {
  return p.replace(/^\/images\//, '')
}
/** "foo.png" -> "/images/foo.png" */
export function filenameToPath(f: string): string {
  return `/images/${f}`
}

/**
 * The five Categorías. `slug` is the stable identifier used to link Proyectos
 * to a Categoría and to select the right section JSON. `anchorId` is the DOM
 * anchor the frontend scrolls to. `order` controls admin/nav ordering. These
 * three fields are CMS-organizational only and do NOT appear in any content JSON.
 *
 * `file` is the section JSON filename that this category reproduces.
 */
export interface CategorySpec {
  slug: 'branding' | 'web-apps' | 'uxui-producto' | 'fotografia-producto' | 'marketing-360'
  file: string
  anchorId: string
  order: number
  name: { es: string; en: string }
}

export const CATEGORY_SPECS: CategorySpec[] = [
  { slug: 'branding', file: 'branding.json', anchorId: 'branding', order: 1, name: { es: 'Branding Corporativo', en: 'Corporate Branding' } },
  { slug: 'web-apps', file: 'web-apps.json', anchorId: 'web-apps', order: 2, name: { es: 'Diseño Web y Apps', en: 'Web & App Design' } },
  { slug: 'uxui-producto', file: 'uxui.json', anchorId: 'uxui', order: 3, name: { es: 'UX/UI Producto', en: 'UX/UI Product' } },
  { slug: 'fotografia-producto', file: 'photography.json', anchorId: 'fotografia', order: 4, name: { es: 'Fotografía de Producto y Packaging', en: 'Product Photography & Packaging' } },
  { slug: 'marketing-360', file: 'marketing-360.json', anchorId: 'marketing-360', order: 5, name: { es: 'Diseño 360°', en: '360° Design' } },
]

export const categoryBySlug = (slug: string) =>
  CATEGORY_SPECS.find((c) => c.slug === slug)

/**
 * Section files that contribute Project docs, and how their cards are laid out.
 * `homeKind` / `pageKind` describe the shape of the project arrays in that file.
 */
export interface SectionProjectSpec {
  slug: CategorySpec['slug']
  file: string
  /**
   * home card layout:
   *  - 'titleProjects': home.projects[] = { image, title, category }
   *  - 'brandingImages': home.images[]  = { src, alt }
   *  - 'none': no home project cards (uxui)
   */
  homeKind: 'titleProjects' | 'brandingImages' | 'none'
  /**
   * page card layout:
   *  - 'altProjects': page.projects[] = { image, alt, category }
   *  - 'brandingGroups': grouped arrays w/ { id, src, alt, category }
   *  - 'none'
   */
  pageKind: 'altProjects' | 'brandingGroups' | 'none'
}

export const SECTION_SPECS: SectionProjectSpec[] = [
  { slug: 'web-apps', file: 'web-apps.json', homeKind: 'titleProjects', pageKind: 'altProjects' },
  { slug: 'fotografia-producto', file: 'photography.json', homeKind: 'titleProjects', pageKind: 'altProjects' },
  { slug: 'marketing-360', file: 'marketing-360.json', homeKind: 'titleProjects', pageKind: 'altProjects' },
  { slug: 'branding', file: 'branding.json', homeKind: 'brandingImages', pageKind: 'brandingGroups' },
  { slug: 'uxui-producto', file: 'uxui.json', homeKind: 'none', pageKind: 'none' },
]

/** Ordered branding page group keys -> JSON array property names. */
export const BRANDING_PAGE_GROUPS: { group: string; jsonKey: string }[] = [
  { group: 'sports', jsonKey: 'sportsProjects' },
  { group: 'adrianaMunoz', jsonKey: 'adrianaMunozProjects' },
  { group: 'anaGrace', jsonKey: 'anaGraceProjects' },
  { group: 'logos', jsonKey: 'logoProjects' },
]

/** The slug of the category the UX/UI case-study Proyecto belongs to. */
export const CASE_STUDY_CATEGORY_SLUG = 'uxui-producto'
export const CASE_STUDY_FILE = 'uxui-casestudy.json'

/**
 * Emitted catalog of every caseStudy Proyecto's resolved inline `body`, consumed
 * by the front-end case-study TEMPLATE (src/app/blocks/CaseStudyTemplate.tsx).
 * Each entry: { categorySlug, slug, body:[{ blockType, content }] } where a
 * block's `content` is `{ [sliceKey]: resolvedSlice }` matching the shape the
 * UX/UI sub-block renderers read.
 */
export const CASE_STUDIES_FILE = 'case-studies.json'

/** body block slug (front-end blockType) -> the case-study top-level slice key. */
export const CASE_STUDY_BODY_SLICE_KEY: Record<string, string> = {
  uxuiHeader: 'header',
  uxuiHero: 'hero',
  uxuiOverview: 'project',
  uxuiIntro: 'intro',
  uxuiProblemSolution: 'problemSolution',
  uxuiDetails: 'details',
  uxuiTimeline: 'timeline',
  uxuiJourney: 'journey',
  uxuiPersonas: 'personas',
  uxuiSketches: 'sketches',
  uxuiLearnings: 'learnings',
}
