/**
 * Local, light-weight TypeScript interfaces for block props.
 *
 * These mirror the shapes in `cms/src/payload-types.ts`, but with two
 * differences that reflect how the future fetch script will emit data for the
 * static front-end:
 *
 *  1. Localized fields arrive as `{ es, en }` (a `Localized`), not a single
 *     string. Renderers pick `field[language]` via `useLanguage()`.
 *  2. Media/relationship references are pre-resolved to plain values (image
 *     paths, resolved project items) — no Payload IDs.
 *
 * We cannot `import type` from `cms/` (it lives outside the front-end build and
 * its types use un-localized single strings), so these are defined by hand.
 */

export type Localized = { es: string; en: string };

/**
 * Shared base every block prop extends. Carries the optional `anchorId` (the
 * CMS `anchorField`) so any block can be linked to from the site menu / hero;
 * the <Blocks> dispatcher renders it as the wrapping element's html `id`.
 */
export interface BlockBase {
  id?: string;
  /** Optional html anchor id for in-page navigation (e.g. 'branding'). */
  anchorId?: string;
}

/** Per-card size token in a masonry gallery (maps to col/row-span classes). */
export type ProjectCardSize =
  | 'normal'
  | 'col3'
  | 'col4'
  | 'hero'
  | 'wide-tall'
  | 'wide5-tall'
  | 'tall'
  | 'med';

/** A single project card, pre-resolved from the Payload `projects` collection. */
export interface ResolvedProject {
  id?: string | number;
  /**
   * Kind of project card:
   *  - 'image'     → clicking opens the shared Lightbox (default, as today).
   *  - 'caseStudy' → the card links to /proyectos/<categorySlug>/<slug> and
   *                  renders its own detail page from `caseStudyLayout`.
   */
  type?: 'image' | 'caseStudy';
  image: string;
  alt: Localized;
  /**
   * The small overlay label on the card. Kept as `category` for backwards
   * compatibility with existing fixtures; the CMS field is `categoryLabel`.
   */
  category: Localized;
  /** Alias emitted by the CMS export; when present it overrides `category`. */
  categoryLabel?: Localized;
  title: Localized;
  /** Case-study slug (segment under the category, e.g. 'snaga'). */
  slug?: string;
  /** Case-study detail layout — rendered by CaseStudyPage via <Blocks>. */
  caseStudyLayout?: AnyBlock[];
  /** Optional per-card masonry span (only used by masonry-* variants). */
  size?: ProjectCardSize;
}

/**
 * Categoría — the top level of the portfolio domain model (mirrors the Payload
 * `categories` collection). Groups a set of resolved projects.
 */
export interface Category {
  id?: string | number;
  name: Localized;
  slug: string;
  anchorId: string;
  intro?: Localized;
  order?: number;
  /** Projects belonging to this category, pre-resolved & sorted by `order`. */
  projects: ResolvedProject[];
}

export interface HeroBlockProps extends BlockBase {
  blockType: 'hero';
  backgroundImagePath?: string;
  title?: Localized;
  subtitle?: Localized;
  body?: Localized;
  cta1?: Localized;
  cta2?: Localized;
}

export interface PortfolioSectionBlockProps extends BlockBase {
  blockType: 'portfolioSection';
  heading?: Localized;
  description?: Localized;
  studioName?: string;
  roleDescription?: Localized;
  ctaLabel?: Localized;
  ctaHref?: string;
}

export interface ProjectGalleryBlockProps extends BlockBase {
  blockType: 'projectGallery';
  layoutVariant:
    | 'grid-3'
    | 'grid-4'
    | 'single'
    | 'masonry-photo'
    | 'masonry-6'
    | 'masonry-8'
    | 'masonry-10';
  /** Pre-resolved project cards (the future fetch script resolves source/filter). */
  projects?: ResolvedProject[];
}

export interface SectionHeadingBlockProps extends BlockBase {
  blockType: 'sectionHeading';
  eyebrow?: Localized;
  number?: string;
  heading?: Localized;
}

export interface RichTextBlockProps extends BlockBase {
  blockType: 'richText';
  heading?: Localized;
  paragraphs?: { text?: Localized }[];
}

export interface TwoColumnBlockProps extends BlockBase {
  blockType: 'twoColumn';
  left?: { label?: Localized; text?: Localized };
  right?: { label?: Localized; text?: Localized };
}

export interface DetailsTableBlockProps extends BlockBase {
  blockType: 'detailsTable';
  title?: Localized;
  rows?: { label?: Localized; value?: Localized }[];
}

export interface TimelineBlockProps extends BlockBase {
  blockType: 'timeline';
  title?: Localized;
  durationLabel?: Localized;
  durationValue?: Localized;
  phases?: { phase?: Localized; duration?: Localized }[];
}

export interface JourneyMapBlockProps extends BlockBase {
  blockType: 'journeyMap';
  title?: Localized;
  intro?: { text?: Localized }[];
  labels?: { action?: Localized; thought?: Localized; friction?: Localized };
  stages?: {
    number?: string;
    name?: Localized;
    action?: Localized;
    thought?: Localized;
    friction?: Localized;
  }[];
  qa?: { question?: Localized; answer?: Localized; bullets?: { text?: Localized }[] }[];
}

export interface PersonaCardsBlockProps extends BlockBase {
  blockType: 'personaCards';
  title?: Localized;
  intro?: { text?: Localized }[];
  qa?: { question?: Localized; answer?: { text?: Localized }[] }[];
  sectionLabels?: {
    basicInfo?: Localized;
    channels?: Localized;
    motivations?: Localized;
    painPoints?: Localized;
  };
  cards?: {
    name?: Localized;
    descriptor?: Localized;
    quote?: Localized;
    basicInfo?: { text?: Localized }[];
    channels?: { text?: Localized }[];
    motivations?: { text?: Localized }[];
    painPoints?: { text?: Localized }[];
  }[];
}

export interface QABlockProps extends BlockBase {
  blockType: 'qa';
  title?: Localized;
  items?: { question?: Localized; answer?: Localized; bullets?: { text?: Localized }[] }[];
}

export interface InfoColumnsBlockProps extends BlockBase {
  blockType: 'infoColumns';
  headings?: { education?: Localized; tools?: Localized; languages?: Localized };
  education?: { item?: Localized }[];
  tools?: { value?: string }[];
  languages?: { value?: string }[];
}

export interface ExperienceAccordionBlockProps extends BlockBase {
  blockType: 'experienceAccordion';
  headings?: { careerPath?: Localized; professionalExperience?: Localized };
  experience?: {
    role?: Localized;
    period?: Localized;
    responsibilities?: { item?: Localized }[];
  }[];
}

export interface ContactBlockProps extends BlockBase {
  blockType: 'contact';
  heading?: Localized;
  body?: Localized;
  email?: string;
  phone?: string;
  socialLinks?: { name?: string; url?: string }[];
  footer?: {
    copyrightPrefix?: string;
    rights?: Localized;
    privacy?: Localized;
    terms?: Localized;
  };
}

export interface ImageBlockProps extends BlockBase {
  blockType: 'image';
  /** Pre-resolved image path. */
  image: string;
  caption?: Localized;
  width?: 'full' | 'contained' | 'half';
}

export interface CTAButtonBlockProps extends BlockBase {
  blockType: 'ctaButton';
  label?: Localized;
  href?: string;
  style?: 'primary' | 'secondary' | 'link';
}

export interface SpacerBlockProps extends BlockBase {
  blockType: 'spacer';
  size: 'small' | 'medium' | 'large' | 'xlarge';
}

/**
 * CategoryShowcase — a home-page block that previews one category's projects.
 *
 * The CMS block references a category by relationship + a set of presentation
 * options; the fetch script resolves that relationship into the embedded
 * `category` (with its projects) so the front-end needs no extra lookup. Image
 * projects open the shared Lightbox; caseStudy projects link to their detail
 * page. Mirrors `cms/src/blocks/CategoryShowcase.ts`.
 */
export interface CategoryShowcaseBlockProps extends BlockBase {
  blockType: 'categoryShowcase';
  /** The resolved category (name/slug/anchorId/intro + its projects). */
  category: Category;
  /** Optional title shown instead of `category.name`. */
  headingOverride?: Localized;
  /** Gallery layout, same variants as ProjectGallery. */
  layoutVariant: ProjectGalleryBlockProps['layoutVariant'];
  /** Limit how many projects render (undefined/0 = all). */
  maxItems?: number;
  showCta?: boolean;
  ctaLabel?: Localized;
  ctaHref?: string;
}

/** Discriminated union of every block instance a page layout may contain. */
export type AnyBlock =
  | HeroBlockProps
  | PortfolioSectionBlockProps
  | ProjectGalleryBlockProps
  | SectionHeadingBlockProps
  | RichTextBlockProps
  | TwoColumnBlockProps
  | DetailsTableBlockProps
  | TimelineBlockProps
  | JourneyMapBlockProps
  | PersonaCardsBlockProps
  | QABlockProps
  | InfoColumnsBlockProps
  | ExperienceAccordionBlockProps
  | ContactBlockProps
  | ImageBlockProps
  | CTAButtonBlockProps
  | SpacerBlockProps
  | CategoryShowcaseBlockProps;

/** A page as emitted by the (future) fetch script from Payload. */
export interface PageData {
  slug: string;
  title?: Localized;
  layout: AnyBlock[];
}

/** A navigation menu item with a resolved href and localized label. */
export interface NavItem {
  label: Localized;
  href: string;
  /** When true, treat as an on-page anchor (e.g. "#work") on the home page. */
  anchor?: boolean;
}
