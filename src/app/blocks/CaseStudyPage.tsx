import { useParams } from "react-router";
import { getCaseStudy } from "./categories";
import { Blocks } from "./registry";
import { NotFound } from "./NotFound";

/**
 * Case-study detail page (/proyectos/:categorySlug/:projectSlug). Finds the
 * caseStudy project and renders its `caseStudyLayout` blocks via <Blocks>.
 * 404 when the category/project is unknown or the project is not a case study.
 */
export function CaseStudyPage() {
  const { categorySlug, projectSlug } = useParams();

  const found =
    categorySlug && projectSlug ? getCaseStudy(categorySlug, projectSlug) : undefined;
  if (!found) {
    return <NotFound />;
  }

  return <Blocks blocks={found.project.caseStudyLayout ?? []} />;
}
