import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { PageRenderer } from "./PageRenderer";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <PageRenderer slug="home" /> },
      { path: "proyectos/branding", element: <PageRenderer slug="branding" /> },
      { path: "proyectos/web-apps", element: <PageRenderer slug="web-apps" /> },
      { path: "proyectos/uxui-producto", element: <PageRenderer slug="uxui-producto" /> },
      { path: "proyectos/fotografia-producto", element: <PageRenderer slug="fotografia-producto" /> },
      { path: "proyectos/marketing-360", element: <PageRenderer slug="marketing-360" /> },
    ],
  },
]);
