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

/** A single project card, pre-resolved from the Payload `projects` collection. */
export interface ResolvedProject {
  id?: string | number;
  image: string;
  alt: Localized;
  category: Localized;
  title: Localized;
}

export interface HeroBlockProps {
  blockType: 'hero';
  id?: string;
  backgroundImagePath?: string;
  title?: Localized;
  subtitle?: Localized;
  body?: Localized;
  cta1?: Localized;
  cta2?: Localized;
}

export interface PortfolioSectionBlockProps {
  blockType: 'portfolioSection';
  id?: string;
  heading?: Localized;
  description?: Localized;
  studioName?: string;
  roleDescription?: Localized;
  ctaLabel?: Localized;
  ctaHref?: string;
}

export interface ProjectGalleryBlockProps {
  blockType: 'projectGallery';
  id?: string;
  layoutVariant: 'masonry-branding' | 'grid-3' | 'masonry-photo' | 'grid-4' | 'single';
  /** Pre-resolved project cards (the future fetch script resolves source/filter). */
  projects?: ResolvedProject[];
}

export interface SectionHeadingBlockProps {
  blockType: 'sectionHeading';
  id?: string;
  eyebrow?: Localized;
  number?: string;
  heading?: Localized;
}

export interface RichTextBlockProps {
  blockType: 'richText';
  id?: string;
  heading?: Localized;
  paragraphs?: { text?: Localized }[];
}

export interface TwoColumnBlockProps {
  blockType: 'twoColumn';
  id?: string;
  left?: { label?: Localized; text?: Localized };
  right?: { label?: Localized; text?: Localized };
}

export interface DetailsTableBlockProps {
  blockType: 'detailsTable';
  id?: string;
  title?: Localized;
  rows?: { label?: Localized; value?: Localized }[];
}

export interface TimelineBlockProps {
  blockType: 'timeline';
  id?: string;
  title?: Localized;
  durationLabel?: Localized;
  durationValue?: Localized;
  phases?: { phase?: Localized; duration?: Localized }[];
}

export interface JourneyMapBlockProps {
  blockType: 'journeyMap';
  id?: string;
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

export interface PersonaCardsBlockProps {
  blockType: 'personaCards';
  id?: string;
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

export interface QABlockProps {
  blockType: 'qa';
  id?: string;
  title?: Localized;
  items?: { question?: Localized; answer?: Localized; bullets?: { text?: Localized }[] }[];
}

export interface InfoColumnsBlockProps {
  blockType: 'infoColumns';
  id?: string;
  headings?: { education?: Localized; tools?: Localized; languages?: Localized };
  education?: { item?: Localized }[];
  tools?: { value?: string }[];
  languages?: { value?: string }[];
}

export interface ExperienceAccordionBlockProps {
  blockType: 'experienceAccordion';
  id?: string;
  headings?: { careerPath?: Localized; professionalExperience?: Localized };
  experience?: {
    role?: Localized;
    period?: Localized;
    responsibilities?: { item?: Localized }[];
  }[];
}

export interface ContactBlockProps {
  blockType: 'contact';
  id?: string;
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

export interface ImageBlockProps {
  blockType: 'image';
  id?: string;
  /** Pre-resolved image path. */
  image: string;
  caption?: Localized;
  width?: 'full' | 'contained' | 'half';
}

export interface CTAButtonBlockProps {
  blockType: 'ctaButton';
  id?: string;
  label?: Localized;
  href?: string;
  style?: 'primary' | 'secondary' | 'link';
}

export interface SpacerBlockProps {
  blockType: 'spacer';
  id?: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
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
  | SpacerBlockProps;

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
