import { useParams } from "react-router";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { PageRenderer } from "../PageRenderer";
import { useLanguage } from "../context/LanguageContext";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { CategoryGallery } from "./CategoryGalleryBlocks";
import { CaseStudyTemplate, findCaseStudy } from "./CaseStudyTemplate";
import pagesData from "../../../content/pages.json";
import categoriesData from "../../../content/categories.json";

/**
 * Category archive route: /proyectos/:categorySlug.
 *
 * Primary path: if a Página exists for this category slug, render it via the
 * normal block pipeline (PageRenderer) — pixel-identical to the hand-authored
 * project pages. Fallback (auto-archive): if a category has NO Página, render
 * that category's Proyectos in a default gallery layout inside the standard
 * project-page shell, so a newly-created category is still browsable.
 */

type LocalizedText = { es: string; en: string };

type ArchiveCategory = {
  slug: string;
  name: LocalizedText;
  page: { title: LocalizedText; description: LocalizedText };
  projects: {
    image: string;
    alt: LocalizedText;
    category: LocalizedText;
    group: string | null;
  }[];
};

const pageSlugs = new Set((pagesData as { pages: { slug: string }[] }).pages.map((p) => p.slug));
const archiveCategories = (categoriesData as { categories: ArchiveCategory[] }).categories;

function AutoArchive({ category }: { category: ArchiveCategory }) {
  const { language, t } = useLanguage();
  useScrollRestoration();

  // Feed the projects into the faithful web-apps page gallery layout — a sane,
  // neutral default for an arbitrary category.
  const content = {
    layoutVariant: "web-apps:page",
    projects: category.projects.map((p, id) => ({
      id,
      src: p.image,
      alt: p.alt,
      category: p.category,
      group: p.group,
    })),
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-gradient-to-br from-slate-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-tl from-purple-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-blue-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm tracking-wider uppercase font-semibold">{t("nav.back")}</span>
          </Link>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {category.page.title[language] || category.name[language]}
          </h1>
          <p className="text-base text-neutral-300 max-w-3xl">
            {category.page.description[language]}
          </p>
        </div>

        {content.projects.length > 0 && <CategoryGallery content={content} />}
      </div>
    </div>
  );
}

export function CategoryArchive() {
  const { categorySlug } = useParams();

  // A category whose single Proyecto is a case study renders that case study's
  // inline body via the case-study TEMPLATE (single source of truth = the
  // Proyecto body). This is the pixel-identical path for /proyectos/uxui-producto.
  const singleCaseStudy = findCaseStudy(categorySlug);
  if (singleCaseStudy) {
    return <CaseStudyTemplate entry={singleCaseStudy} />;
  }

  // A hand-authored Página wins (pixel-identical project pages).
  if (categorySlug && pageSlugs.has(categorySlug)) {
    return <PageRenderer slug={categorySlug} />;
  }

  // Otherwise fall back to the auto-archive if the category exists.
  const category = archiveCategories.find((c) => c.slug === categorySlug);
  if (category) {
    return <AutoArchive category={category} />;
  }

  return null;
}

/**
 * Case-study route: /proyectos/:categorySlug/:projectSlug.
 * Renders the named case study's inline body via the case-study template.
 */
export function CaseStudyRoute() {
  const { categorySlug, projectSlug } = useParams();
  const entry = findCaseStudy(categorySlug, projectSlug);
  if (entry) return <CaseStudyTemplate entry={entry} />;
  return null;
}
