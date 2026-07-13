import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Page } from "./blocks/Page";

/**
 * Dynamic, data-driven routing. A single catch-all route renders <Page>, which
 * looks up the page for the current URL by `slug` from content/pages.json and
 * renders its blocks. Layout (nav + outlet + scroll-to-top) wraps every route.
 *
 * Home is slug '' or 'home' at path '/'. Unknown slugs render the 404 inside
 * <Page> so the nav/layout stay in place.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Page },
      { path: "*", Component: Page },
    ],
  },
]);
