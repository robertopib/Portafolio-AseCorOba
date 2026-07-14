import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Page } from "./blocks/Page";
import { CategoryPage } from "./blocks/CategoryPage";
import { CaseStudyPage } from "./blocks/CaseStudyPage";

/**
 * Dynamic, data-driven routing. Layout (nav + outlet + scroll-to-top) wraps
 * every route.
 *
 *   /                                  → <Page> (home, blocks from pages.json)
 *   /proyectos/:categorySlug           → <CategoryPage> (category intro + projects)
 *   /proyectos/:categorySlug/:projectSlug → <CaseStudyPage> (caseStudyLayout blocks)
 *   /*                                 → <Page> (other page slugs; 404 inside)
 *
 * The two explicit `/proyectos/...` routes take precedence over the catch-all,
 * so the portfolio domain model owns those URLs. Any other slug (e.g. a custom
 * page in pages.json) still falls through to <Page>; unknown slugs render 404.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Page },
      { path: "proyectos/:categorySlug", Component: CategoryPage },
      { path: "proyectos/:categorySlug/:projectSlug", Component: CaseStudyPage },
      { path: "*", Component: Page },
    ],
  },
]);
