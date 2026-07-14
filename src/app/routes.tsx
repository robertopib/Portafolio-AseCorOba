import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { PageRenderer } from "./PageRenderer";
import { CategoryArchive } from "./blocks/CategoryArchive";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <PageRenderer slug="home" /> },
      // Category archive: renders via the category's Página (pixel-identical)
      // when one exists, else an auto-archive of that category's Proyectos.
      { path: "proyectos/:categorySlug", element: <CategoryArchive /> },
    ],
  },
]);
