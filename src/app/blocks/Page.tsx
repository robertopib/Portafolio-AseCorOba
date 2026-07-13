import { useLocation } from "react-router";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getPageByPath } from "./pages";
import { Blocks } from "./registry";
import { NotFound } from "./NotFound";

/**
 * Dynamic page renderer. Resolves the current URL to a page in
 * content/pages.json and renders its block layout via <Blocks>. Unknown slugs
 * render the 404 component.
 *
 * The homepage scroll-restoration behaviour (useScrollRestoration) is preserved
 * here; Layout continues to handle scroll-to-top for non-home routes.
 */
export function Page() {
  const { pathname } = useLocation();
  useScrollRestoration();

  const page = getPageByPath(pathname);
  if (!page) {
    return <NotFound />;
  }

  return <Blocks blocks={page.layout} />;
}
