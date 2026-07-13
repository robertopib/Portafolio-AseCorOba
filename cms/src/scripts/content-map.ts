/**
 * Shared mapping tables between the committed frontend content JSON
 * (content/*.json, content/sections/*.json) and the Payload data model.
 *
 * Used by both seed.ts (write) and roundtrip.ts (read + reconstruct) so the
 * two stay perfectly in sync.
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
 * Section files that contribute Project docs.
 * `section` is the Projects.section select value.
 * `file` is the JSON filename under content/sections/.
 * `homeKind` / `pageKind` describe how project cards are laid out in that file.
 */
export interface SectionProjectSpec {
  section: 'web-apps' | 'branding' | 'uxui-producto' | 'fotografia-producto' | 'marketing-360'
  file: string
  /**
   * home card layout:
   *  - 'titleProjects': home.projects[] = { image, title, category }
   *  - 'brandingImages': home.images[]  = { src, alt }
   *  - 'none': no home project cards
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
  { section: 'web-apps', file: 'web-apps.json', homeKind: 'titleProjects', pageKind: 'altProjects' },
  { section: 'fotografia-producto', file: 'photography.json', homeKind: 'titleProjects', pageKind: 'altProjects' },
  { section: 'marketing-360', file: 'marketing-360.json', homeKind: 'titleProjects', pageKind: 'altProjects' },
  { section: 'branding', file: 'branding.json', homeKind: 'brandingImages', pageKind: 'brandingGroups' },
  { section: 'uxui-producto', file: 'uxui.json', homeKind: 'none', pageKind: 'none' },
]

/** Ordered branding page group keys -> JSON array property names. */
export const BRANDING_PAGE_GROUPS: { group: string; jsonKey: string }[] = [
  { group: 'sports', jsonKey: 'sportsProjects' },
  { group: 'adrianaMunoz', jsonKey: 'adrianaMunozProjects' },
  { group: 'anaGrace', jsonKey: 'anaGraceProjects' },
  { group: 'logos', jsonKey: 'logoProjects' },
]

/**
 * Mapping of SectionText global groups <-> section JSON files.
 * Only the text (non-project-array) portions are captured here.
 */
export const SECTION_TEXT_MAP: { group: string; file: string; hasSectionHeading?: boolean; hasBrandingPageExtras?: boolean; isUxui?: boolean }[] = [
  { group: 'webApps', file: 'web-apps.json' },
  { group: 'branding', file: 'branding.json', hasSectionHeading: true, hasBrandingPageExtras: true },
  { group: 'photography', file: 'photography.json' },
  { group: 'marketing360', file: 'marketing-360.json' },
  { group: 'uxui', file: 'uxui.json', isUxui: true },
]
