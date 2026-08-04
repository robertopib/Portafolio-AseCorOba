import type { ComponentType, ReactNode } from "react";
import { HeroSection } from "./components/HeroSection";
import { CorporateBranding } from "./components/CorporateBranding";
import { WebAppDesign } from "./components/WebAppDesign";
import { UXUIProduct } from "./components/UXUIProduct";
import { ProductPhotography } from "./components/ProductPhotography";
import { Marketing360 } from "./components/Marketing360";
import { AboutSection } from "./components/AboutSection";
import { AboutContact } from "./components/AboutContact";
import {
  BrandingHeader,
  BrandingGalleryDeportes,
  BrandingGalleryBelleza,
  BrandingGalleryLogos,
} from "./blocks/BrandingBlocks";
import { WebAppHeader, WebAppGallery } from "./blocks/WebAppBlocks";
import { PhotographyHeader, PhotographyGallery } from "./blocks/PhotographyBlocks";
import { MarketingHeader, MarketingGallery } from "./blocks/MarketingBlocks";
import {
  UXUIHeader,
  UXUIHero,
  UXUIOverview,
  UXUIIntro,
  UXUIProblemSolution,
  UXUIDetails,
  UXUITimeline,
  UXUIJourney,
  UXUIPersonas,
  UXUISketches,
  UXUILearnings,
} from "./blocks/UXUIBlocks";
import { CategoryGallery, PortfolioIntro } from "./blocks/CategoryGalleryBlocks";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import pagesData from "../../content/pages.json";

/**
 * The registry's view of a block component.
 *
 * Every block declares its OWN `content` prop type, and those types are all
 * different, so the registry cannot name a single one. It stores the weakest
 * thing that is true of all of them: something callable that does not require
 * a `content` of any particular shape. In practice this accepts every block —
 * those with an optional typed `content` prop, and the home sections that take
 * no props at all and self-source their content — while still REJECTING a
 * component that needs some other prop. Widening back to the real, opaque
 * `content` happens once, at the lookup in PageRenderer below.
 */
type RegisteredBlock = ComponentType<{ content?: never }>;

/**
 * The same component as the renderer calls it: `content` is opaque, because its
 * shape is per-blockType and is validated by the block's own prop type.
 */
type BlockComponent = ComponentType<{ content?: unknown }>;

/**
 * Block registry: maps a CMS `blockType` to the ORIGINAL front-end component or
 * to a block renderer that reproduces a page sub-section's markup VERBATIM.
 *
 * The home page's blocks render whole ORIGINAL section components (no props,
 * self-sourced). The project pages are decomposed into their real sub-sections
 * as blocks, each extracted verbatim from the original page component, so the
 * design stays pixel-identical while the CMS controls composition.
 */
const blockRegistry: Record<string, RegisteredBlock> = {
  // Home
  hero: HeroSection,
  brandingPreview: CorporateBranding,
  webAppsPreview: WebAppDesign,
  uxuiPreview: UXUIProduct,
  fotografiaPreview: ProductPhotography,
  marketingPreview: Marketing360,
  experiencia: AboutSection,
  contacto: AboutContact,

  // Branding project page
  brandingHeader: BrandingHeader,
  "gallery:deportes": BrandingGalleryDeportes,
  "gallery:belleza": BrandingGalleryBelleza,
  "gallery:logos": BrandingGalleryLogos,

  // Web & Apps project page
  webAppsHeader: WebAppHeader,
  webAppsGallery: WebAppGallery,

  // Fotografía project page
  fotografiaHeader: PhotographyHeader,
  fotografiaGallery: PhotographyGallery,

  // Marketing 360 project page
  marketingHeader: MarketingHeader,
  marketingGallery: MarketingGallery,

  // UX/UI Producto case-study sub-blocks
  uxuiHeader: UXUIHeader,
  uxuiHero: UXUIHero,
  uxuiOverview: UXUIOverview,
  uxuiIntro: UXUIIntro,
  uxuiProblemSolution: UXUIProblemSolution,
  uxuiDetails: UXUIDetails,
  uxuiTimeline: UXUITimeline,
  uxuiJourney: UXUIJourney,
  uxuiPersonas: UXUIPersonas,
  uxuiSketches: UXUISketches,
  uxuiLearnings: UXUILearnings,

  // WordPress "query blocks": a CategoryGallery references a Categoría and
  // renders its Proyectos in the faithful layout (chosen by layoutVariant),
  // fed from content/pages.json. PortfolioIntro is the inline intro; on the
  // home page its content is drawn by the paired CategoryGallery, so it renders
  // nothing itself.
  categoryGallery: CategoryGallery,
  portfolioIntro: PortfolioIntro,
};

type LocalizedText = { es: string; en: string };

type Block = {
  blockType: string;
  anchorId?: string | null;
  // Inline content for CONTENT blocks (hero, page headers, UX/UI case-study
  // sub-blocks, career, about/contact). Emitted by the CMS into
  // content/pages.json and passed straight to the block renderer as its
  // `content` prop, so a block carries and edits its own content in place.
  // Its shape is per-blockType (validated by each renderer's own prop type);
  // here it is opaque and passed through verbatim.
  content?: unknown;
  // Informational metadata emitted by the CMS for gallery blocks. The block
  // renderers self-source their images from content/sections/*.json (the source
  // of truth), so these fields are not consumed at render time — they document
  // which Proyectos a gallery block corresponds to.
  subheading?: LocalizedText;
  source?: {
    category?: string;
    placement?: string;
    group?: string;
  };
};

type Page = {
  slug: string;
  blocks: Block[];
};

type PagesFile = {
  pages: Page[];
};

const pages = (pagesData as PagesFile).pages;

/**
 * Per-slug page shell. The project pages wrap their blocks in the exact outer
 * container + decorative gradient shapes + centered content column that the
 * original page components rendered. The home page uses no shell so its layout
 * stays byte-identical.
 */
type Shell = (children: ReactNode) => ReactNode;

const PAGE_SHELLS: Record<string, Shell> = {
  branding: (children) => (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">{children}</div>
    </div>
  ),
  "web-apps": (children) => (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-gradient-to-br from-slate-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-tl from-purple-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">{children}</div>
    </div>
  ),
  "fotografia-producto": (children) => (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-rose-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-tl from-purple-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">{children}</div>
    </div>
  ),
  "marketing-360": (children) => (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-tl from-slate-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">{children}</div>
    </div>
  ),
  "uxui-producto": (children) => (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative z-10">{children}</div>
    </div>
  ),
};

/**
 * Data-driven page composition. Reads the ordered block list for `slug` from
 * content/pages.json and renders each block via the block registry, preserving
 * order, additions and deletions the CMS makes.
 */
export function PageRenderer({ slug }: { slug: string }) {
  // Preserve the home page's intentional scroll restoration behavior.
  // Safe to always call (it is a no-op for non-home routes).
  useScrollRestoration();

  const page = pages.find((p) => p.slug === slug);

  if (!page) {
    return null;
  }

  const content = page.blocks.map((block, index) => {
    // REASON for the cast: this is the one point where the registry's
    // deliberately-weak entry type is widened back to "takes the opaque content
    // the CMS emitted for this blockType". It cannot be proven — there is no
    // compile-time relationship between a `blockType` string and the shape of
    // its JSON — so it is asserted, once, here, instead of with an `any` per
    // registry entry. R12 adds the runtime validation this stands in for; if a
    // block's `content` prop and its CMS block ever disagree, that mismatch is
    // invisible to the typechecker and will only show up at render.
    const Component = blockRegistry[block.blockType] as BlockComponent | undefined;
    if (!Component) {
      // Unknown block type: skip rather than break the whole page.
      return null;
    }

    // Inline content (if any) flows to the renderer via its `content` prop.
    const content = block.content;

    const anchorId = block.anchorId?.trim();
    if (anchorId) {
      return (
        <div id={anchorId} key={`${block.blockType}-${index}`}>
          <Component content={content} />
        </div>
      );
    }

    // No anchor: render the component directly with no wrapper so the
    // layout is byte-identical to the original.
    return <Component key={`${block.blockType}-${index}`} content={content} />;
  });

  const shell = PAGE_SHELLS[slug];
  if (shell) {
    return <>{shell(content)}</>;
  }

  return <>{content}</>;
}
