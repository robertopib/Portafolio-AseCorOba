import { useParams } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import { getCategoryBySlug } from "./categories";
import { ProjectGrid } from "./ProjectGrid";
import { NotFound } from "./NotFound";

/**
 * Category page (/proyectos/:categorySlug). Renders the category intro + all its
 * projects: 'image' projects open the shared Lightbox, 'caseStudy' projects link
 * to their detail page (both handled by <ProjectGrid>). 404 when the slug is
 * unknown. Uses masonry-6 as the page layout (matches the existing project pages).
 */
export function CategoryPage() {
  const { language } = useLanguage();
  const { categorySlug } = useParams();

  const category = categorySlug ? getCategoryBySlug(categorySlug) : undefined;
  if (!category) {
    return <NotFound />;
  }

  const intro = category.intro?.[language];

  return (
    <section className="min-h-screen py-24 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 uppercase">
            {category.name?.[language]}
          </h1>
          {intro && (
            <p className="text-base text-neutral-400 leading-relaxed mt-6 max-w-3xl">
              {intro}
            </p>
          )}
        </div>

        <ProjectGrid
          projects={category.projects ?? []}
          layoutVariant="masonry-6"
          language={language}
          categorySlug={category.slug}
        />
      </div>
    </section>
  );
}
