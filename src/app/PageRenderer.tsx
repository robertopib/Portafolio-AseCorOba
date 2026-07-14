import type { ComponentType } from "react";
import { HeroSection } from "./components/HeroSection";
import { CorporateBranding } from "./components/CorporateBranding";
import { WebAppDesign } from "./components/WebAppDesign";
import { UXUIProduct } from "./components/UXUIProduct";
import { ProductPhotography } from "./components/ProductPhotography";
import { Marketing360 } from "./components/Marketing360";
import { AboutSection } from "./components/AboutSection";
import { AboutContact } from "./components/AboutContact";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import pagesData from "../../content/pages.json";

/**
 * Block registry: maps a CMS `blockType` to the ORIGINAL front-end component.
 *
 * Every component is rendered with NO props — the originals self-source their
 * data from content/*.json, so rendering them via this registry produces the
 * exact same markup as the hand-written HomePage did. This is what guarantees
 * pixel-parity while letting the CMS control which blocks appear and in what
 * order.
 */
const blockRegistry: Record<string, ComponentType> = {
  hero: HeroSection,
  brandingPreview: CorporateBranding,
  webAppsPreview: WebAppDesign,
  uxuiPreview: UXUIProduct,
  fotografiaPreview: ProductPhotography,
  marketingPreview: Marketing360,
  experiencia: AboutSection,
  contacto: AboutContact,
};

type Block = {
  blockType: string;
  anchorId?: string | null;
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

  return (
    <>
      {page.blocks.map((block, index) => {
        const Component = blockRegistry[block.blockType];
        if (!Component) {
          // Unknown block type: skip rather than break the whole page.
          return null;
        }

        const anchorId = block.anchorId?.trim();
        if (anchorId) {
          return (
            <div id={anchorId} key={`${block.blockType}-${index}`}>
              <Component />
            </div>
          );
        }

        // No anchor: render the component directly with no wrapper so the
        // layout is byte-identical to the original HomePage.
        return <Component key={`${block.blockType}-${index}`} />;
      })}
    </>
  );
}
