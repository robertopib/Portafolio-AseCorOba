import { useLanguage } from "../context/LanguageContext";
import { ProjectGrid } from "./ProjectGrid";
import type { CategoryShowcaseBlockProps, ResolvedProject } from "./types";

/**
 * CategoryShowcase block — previews one category's projects on the home page.
 *
 * Renders:
 *  - a heading (headingOverride, else category.name) + the category intro,
 *  - the projects via the shared <ProjectGrid> (same layouts as ProjectGallery),
 *  - an optional CTA button.
 *
 * Image projects open the shared Lightbox; caseStudy projects link to
 * /proyectos/<categorySlug>/<projectSlug> (both handled inside ProjectGrid).
 * `maxItems` limits how many projects render.
 */
export function CategoryShowcase(props: CategoryShowcaseBlockProps) {
  const { language } = useLanguage();
  const { category } = props;
  if (!category) return null;

  const heading = props.headingOverride?.[language] || category.name?.[language];
  const intro = category.intro?.[language];

  let projects: ResolvedProject[] = category.projects ?? [];
  if (props.maxItems && props.maxItems > 0) {
    projects = projects.slice(0, props.maxItems);
  }

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes (match ProjectGallery). */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {(heading || intro) && (
          <div className="mb-10">
            {heading && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-100 uppercase">
                {heading}
              </h2>
            )}
            {intro && (
              <p className="text-base text-neutral-400 leading-relaxed mt-4 max-w-3xl">
                {intro}
              </p>
            )}
          </div>
        )}

        <ProjectGrid
          projects={projects}
          layoutVariant={props.layoutVariant}
          language={language}
          categorySlug={category.slug}
        />

        {props.showCta && props.ctaHref && (
          <div className="mt-10">
            <a
              href={props.ctaHref}
              className="inline-block px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-[3px] transition-all duration-300"
            >
              {props.ctaLabel?.[language]}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
