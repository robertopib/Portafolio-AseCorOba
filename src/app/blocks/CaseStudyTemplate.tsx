import type { ComponentType } from "react";
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
} from "./UXUIBlocks";
import type { CaseStudyContent } from "./UXUIBlocks";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import caseStudiesData from "../../../content/case-studies.json";

/**
 * Case-study TEMPLATE.
 *
 * Renders a caseStudy Proyecto's inline `body` — an ordered list of UX/UI
 * sub-blocks (edited on the Proyecto like a WP post body) — via the SAME
 * pixel-faithful sub-block renderers used before. Only the data source changed:
 * a block's content comes from the Proyecto body (content/case-studies.json),
 * not from a Página.
 *
 * Each body block carries only its own slice of the case study (e.g. a
 * `uxuiPersonas` block's content is `{ personas: {...} }`). Every sub-block
 * renderer reads exactly one top-level slice, so a sliced `content` renders
 * byte-identically to being handed the whole case study. The wrapping shell is
 * the exact `uxui-producto` project-page shell (max-w-5xl), so the output
 * matches the original hand-authored case-study page.
 */

// Body blockType -> sub-block renderer (1:1 with the UX/UI block registry).
const caseStudyBlockRegistry: Record<string, ComponentType<{ content?: CaseStudyContent }>> = {
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

type BodyBlock = { blockType: string; content?: unknown };
type CaseStudyEntry = { categorySlug: string; slug: string | null; body: BodyBlock[] };
type CaseStudiesFile = { caseStudies: CaseStudyEntry[] };

const caseStudies = (caseStudiesData as CaseStudiesFile).caseStudies;

/** Look up a case study by its category slug and (optional) project slug. */
export function findCaseStudy(categorySlug?: string, projectSlug?: string): CaseStudyEntry | undefined {
  if (!categorySlug) return undefined;
  const inCategory = caseStudies.filter((c) => c.categorySlug === categorySlug);
  if (projectSlug) return inCategory.find((c) => c.slug === projectSlug);
  // No project slug: resolve to the category's single case study (if unique).
  return inCategory.length === 1 ? inCategory[0] : undefined;
}

/** The `uxui-producto` project-page shell, reproduced verbatim (max-w-5xl). */
function CaseStudyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative z-10">{children}</div>
    </div>
  );
}

/** Render a resolved case-study entry's body via the sub-block renderers. */
export function CaseStudyTemplate({ entry }: { entry: CaseStudyEntry }) {
  useScrollRestoration();

  const content = entry.body.map((block, index) => {
    const Component = caseStudyBlockRegistry[block.blockType];
    if (!Component) return null;
    return (
      <Component key={`${block.blockType}-${index}`} content={block.content as CaseStudyContent} />
    );
  });

  return <CaseStudyShell>{content}</CaseStudyShell>;
}
