import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { PageRenderer } from "./PageRenderer";
import { BrandingProjects } from "./pages/BrandingProjects";
import { WebAppProjects } from "./pages/WebAppProjects";
import { UXUIProductProjects } from "./pages/UXUIProductProjects";
import { ProductPhotographyProjects } from "./pages/ProductPhotographyProjects";
import { Marketing360Projects } from "./pages/Marketing360Projects";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <PageRenderer slug="home" /> },
      { path: "proyectos/branding", Component: BrandingProjects },
      { path: "proyectos/web-apps", Component: WebAppProjects },
      { path: "proyectos/uxui-producto", Component: UXUIProductProjects },
      { path: "proyectos/fotografia-producto", Component: ProductPhotographyProjects },
      { path: "proyectos/marketing-360", Component: Marketing360Projects },
    ],
  },
]);