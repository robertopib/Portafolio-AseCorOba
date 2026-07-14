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
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import pagesData from "../../content/pages.json";

/**
 * Block registry: maps a CMS `blockType` to the ORIGINAL front-end component or
 * to a block renderer that reproduces a page sub-section's markup VERBATIM.
 *
 * The home page's blocks render whole ORIGINAL section components (no props,
 * self-sourced). The project pages are decomposed into their real sub-sections
 * as blocks, each extracted verbatim from the original page component, so the
 * design stays pixel-identical while the CMS controls composition.
 */
const blockRegistry: Record<string, ComponentType<{ content?: unknown }>> = {
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
    const Component = blockRegistry[block.blockType];
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
