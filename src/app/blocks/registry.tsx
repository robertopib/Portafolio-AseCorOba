import type { ComponentType } from "react";
import type { AnyBlock } from "./types";

import { Hero } from "./Hero";
import { PortfolioSection } from "./PortfolioSection";
import { ProjectGallery } from "./ProjectGallery";
import { SectionHeading } from "./SectionHeading";
import { RichText } from "./RichText";
import { TwoColumn } from "./TwoColumn";
import { DetailsTable } from "./DetailsTable";
import { Timeline } from "./Timeline";
import { JourneyMap } from "./JourneyMap";
import { PersonaCards } from "./PersonaCards";
import { QA } from "./QA";
import { InfoColumns } from "./InfoColumns";
import { ExperienceAccordion } from "./ExperienceAccordion";
import { Contact } from "./Contact";
import { ImageBlock } from "./ImageBlock";
import { CTAButton } from "./CTAButton";
import { Spacer } from "./Spacer";
import { CategoryShowcase } from "./CategoryShowcase";

/**
 * Registry mapping each block `blockType` (the Payload block `slug`) to its
 * renderer component. Adding a new block type is a one-line change here.
 *
 * Renderers are typed to their own props; the map is intentionally loosely
 * typed (each entry accepts its matching block) and the <Blocks> dispatcher
 * casts per-instance, so the discriminated union stays the single source of
 * truth for callers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const blockRegistry: Record<string, ComponentType<any>> = {
  hero: Hero,
  portfolioSection: PortfolioSection,
  projectGallery: ProjectGallery,
  sectionHeading: SectionHeading,
  richText: RichText,
  twoColumn: TwoColumn,
  detailsTable: DetailsTable,
  timeline: Timeline,
  journeyMap: JourneyMap,
  personaCards: PersonaCards,
  qa: QA,
  infoColumns: InfoColumns,
  experienceAccordion: ExperienceAccordion,
  contact: Contact,
  image: ImageBlock,
  ctaButton: CTAButton,
  spacer: Spacer,
  categoryShowcase: CategoryShowcase,
};

/**
 * Renders an ordered list of block instances to their registered renderers.
 * Unknown block types are skipped gracefully (a dev warning is emitted).
 */
export function Blocks({ blocks }: { blocks: AnyBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const Renderer = blockRegistry[block.blockType];
        if (!Renderer) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn(`[Blocks] No renderer for block type "${block.blockType}" — skipping.`);
          }
          return null;
        }
        const key = block.id ?? `${block.blockType}-${index}`;
        const rendered = <Renderer key={key} {...block} />;
        // When a block carries an anchorId, wrap it in a container that owns the
        // html `id` so the menu / hero can scroll to it. Layout is otherwise
        // identical to the un-anchored case (a bare fragment-equivalent wrapper).
        if (block.anchorId) {
          return (
            <div key={key} id={block.anchorId}>
              {rendered}
            </div>
          );
        }
        return rendered;
      })}
    </>
  );
}
