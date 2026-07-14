import { useLanguage } from "../context/LanguageContext";
import { ProjectGrid } from "./ProjectGrid";
import type { ProjectGalleryBlockProps, ResolvedProject } from "./types";

/**
 * ProjectGallery block — renders a set of pre-resolved project cards in one of
 * the layout variants. The actual grid + lightbox rendering now lives in the
 * shared <ProjectGrid> (also reused by CategoryShowcase / CategoryPage); this
 * block just keeps the section chrome (padding + gradient background) that the
 * home/category pages expect.
 *
 * Layout variants:
 *   - 'grid-3'        → WebAppDesign / CorporateBranding home grid
 *   - 'grid-4'        → Marketing360 home grid
 *   - 'masonry-photo' → ProductPhotography home grid (1 large + mediums)
 *   - 'masonry-6/8/10'→ project-page masonry over a 6/8/10-col grid
 *   - 'single'        → one image, contained width
 *
 * 'image' projects open the shared Lightbox; 'caseStudy' projects link to their
 * detail page (handled inside ProjectGrid).
 */
export function ProjectGallery(props: ProjectGalleryBlockProps) {
  const { language } = useLanguage();
  const projects: ResolvedProject[] = props.projects ?? [];

  if (projects.length === 0) return null;

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <ProjectGrid
          projects={projects}
          layoutVariant={props.layoutVariant}
          language={language}
        />
      </div>
    </section>
  );
}
