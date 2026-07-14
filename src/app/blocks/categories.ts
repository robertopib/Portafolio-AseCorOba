import categoriesData from "../../../content/categories.json";
import type { Category, ResolvedProject } from "./types";

/**
 * Build-time data access for the portfolio domain model. `content/categories.json`
 * is the fixture the future CMS export will emit; it contains every Categoría
 * with its resolved projects embedded (image + caseStudy). These helpers resolve
 * categories by slug and case-study projects by (categorySlug, projectSlug).
 */

const categories = (categoriesData.categories ?? []) as unknown as Category[];

/** All categories, sorted by their `order` (ascending, undefined last). */
export function getAllCategories(): Category[] {
  return [...categories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/** Look up a single category by its slug. */
export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/**
 * Find a case-study project by category slug + project slug. Returns both the
 * category and the project so the case-study page can render breadcrumbs/context.
 */
export function getCaseStudy(
  categorySlug: string,
  projectSlug: string,
): { category: Category; project: ResolvedProject } | undefined {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return undefined;
  const project = category.projects.find(
    (p) => p.type === "caseStudy" && p.slug === projectSlug,
  );
  if (!project) return undefined;
  return { category, project };
}
