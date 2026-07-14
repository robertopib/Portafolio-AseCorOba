import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router";
import { Lightbox } from "../components/Lightbox";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import type { ResolvedProject, ProjectCardSize } from "./types";

/**
 * Shared project-grid rendering, extracted from ProjectGallery so both
 * ProjectGallery and CategoryShowcase render identical layouts.
 *
 * Responsibilities:
 *  - Owns the layout variants (grid-3, grid-4, masonry-photo, masonry-*,
 *    single) and the single shared Lightbox for 'image' projects.
 *  - Per card, decides between a lightbox trigger ('image' projects, default)
 *    and a <Link> to the case-study detail page ('caseStudy' projects). The
 *    case-study href is /proyectos/<categorySlug>/<project.slug>.
 *
 * The card visual markup is unchanged from the original ProjectGallery; the
 * only difference is that a card is wrapped in a <Link> instead of getting an
 * onClick lightbox handler when the project is a case study.
 */

export type GalleryLayoutVariant =
  | "grid-3"
  | "grid-4"
  | "single"
  | "masonry-photo"
  | "masonry-6"
  | "masonry-8"
  | "masonry-10";

/** Localized-label helper: prefer categoryLabel, fall back to category. */
function cardLabel(project: ResolvedProject, language: "es" | "en"): string {
  return (project.categoryLabel?.[language] ?? project.category?.[language]) ?? "";
}

/**
 * Per-card size token → Tailwind col/row-span classes (masonry-* variants).
 */
const SIZE_SPANS: Record<ProjectCardSize, string> = {
  normal: "col-span-2 md:col-span-2",
  col3: "col-span-2 md:col-span-3",
  col4: "col-span-4 md:col-span-4",
  hero: "col-span-4 md:col-span-4 row-span-2",
  "wide-tall": "col-span-2 md:col-span-3 row-span-2",
  "wide5-tall": "col-span-4 md:col-span-5 row-span-2",
  tall: "col-span-2 md:col-span-2 row-span-2",
  med: "col-span-2 md:col-span-2 row-span-1",
};

const MASONRY_COLS: Record<string, string> = {
  "masonry-6": "grid-cols-4 md:grid-cols-6",
  "masonry-8": "grid-cols-4 md:grid-cols-8",
  "masonry-10": "grid-cols-4 md:grid-cols-10",
};

/** Case-study detail route for a project within a category. */
export function caseStudyHref(categorySlug: string, projectSlug?: string): string {
  return `/proyectos/${categorySlug}/${projectSlug ?? ""}`;
}

type ProjectGridProps = {
  projects: ResolvedProject[];
  layoutVariant: GalleryLayoutVariant;
  language: "es" | "en";
  /** Category slug used to build case-study links (required for caseStudy cards). */
  categorySlug?: string;
};

/**
 * Renders the projects in the chosen layout, wiring case-study links and the
 * shared image lightbox. Returns null when there are no projects.
 */
export function ProjectGrid({ projects, layoutVariant, language, categorySlug }: ProjectGridProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (projects.length === 0) return null;

  // The lightbox only cycles through 'image' projects. We build an index map
  // from the full projects array to the image-only subset so navigation stays
  // correct even when case studies are interleaved.
  const imageProjects = projects.filter((p) => p.type !== "caseStudy");
  const imageIndexOf = (project: ResolvedProject) => imageProjects.indexOf(project);

  const openLightbox = (project: ResolvedProject) => {
    const i = imageIndexOf(project);
    if (i >= 0) setSelectedImage(i);
  };
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null && imageProjects.length > 0) {
      setSelectedImage((selectedImage + 1) % imageProjects.length);
    }
  };
  const prevImage = () => {
    if (selectedImage !== null && imageProjects.length > 0) {
      setSelectedImage((selectedImage - 1 + imageProjects.length) % imageProjects.length);
    }
  };

  const shared: VariantProps = {
    projects,
    language,
    categorySlug,
    onImageClick: openLightbox,
  };

  return (
    <>
      {layoutVariant === "grid-3" && <GridThree {...shared} />}
      {layoutVariant === "grid-4" && <GridFour {...shared} />}
      {layoutVariant === "masonry-photo" && <MasonryPhoto {...shared} />}
      {(layoutVariant === "masonry-6" ||
        layoutVariant === "masonry-8" ||
        layoutVariant === "masonry-10") && (
        <Masonry {...shared} colsClass={MASONRY_COLS[layoutVariant]} />
      )}
      {layoutVariant === "single" && <Single {...shared} />}

      {/* Lightbox Modal — shared across variants, cycles image-only projects */}
      {selectedImage !== null && imageProjects[selectedImage] && (
        <Lightbox>
          <div
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-neutral-100 p-3 rounded-[3px] transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <ImageWithFallback
                  src={imageProjects[selectedImage].image}
                  alt={imageProjects[selectedImage].alt[language]}
                  className="max-w-none max-h-[90vh] w-auto h-auto"
                />
                <p className="text-neutral-100 text-center mt-6 text-base absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  {imageProjects[selectedImage].alt[language]}
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-3">
              {imageProjects.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === selectedImage ? "bg-white" : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </Lightbox>
      )}
    </>
  );
}

type VariantProps = {
  projects: ResolvedProject[];
  language: "es" | "en";
  categorySlug?: string;
  onImageClick: (project: ResolvedProject) => void;
};

/**
 * Card wrapper: renders a <Link> to the case-study page for caseStudy projects,
 * or a clickable <div> that opens the lightbox for image projects. Keeps the
 * exact className/onClick contract the original grids relied on.
 */
function CardShell({
  project,
  categorySlug,
  onImageClick,
  className,
  children,
}: {
  project: ResolvedProject;
  categorySlug?: string;
  onImageClick: (project: ResolvedProject) => void;
  className: string;
  children: React.ReactNode;
}) {
  if (project.type === "caseStudy" && categorySlug) {
    return (
      <Link to={caseStudyHref(categorySlug, project.slug)} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <div className={className} onClick={() => onImageClick(project)}>
      {children}
    </div>
  );
}

/** grid-3 — three equal cards per row. */
function GridThree({ projects, language, categorySlug, onImageClick }: VariantProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {projects.map((project, index) => (
        <CardShell
          key={project.id ?? index}
          project={project}
          categorySlug={categorySlug}
          onImageClick={onImageClick}
          className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-slate-400/15 via-purple-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500 block"
        >
          <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
            <ImageWithFallback
              src={project.image}
              alt={project.title[language]}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-6 text-neutral-100">
                <p className="text-sm tracking-widest uppercase mb-2 text-slate-300 font-semibold">{cardLabel(project, language)}</p>
                <h3 className="text-lg font-bold uppercase">{project.title[language]}</h3>
              </div>
            </div>
          </div>
        </CardShell>
      ))}
    </div>
  );
}

/** grid-4 — four equal cards per row. */
function GridFour({ projects, language, categorySlug, onImageClick }: VariantProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {projects.map((project, index) => (
        <CardShell
          key={project.id ?? index}
          project={project}
          categorySlug={categorySlug}
          onImageClick={onImageClick}
          className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-400/15 via-slate-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500 block"
        >
          <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
            <ImageWithFallback
              src={project.image}
              alt={project.title[language]}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-slate-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-6 text-neutral-100">
                <p className="text-xs tracking-widest uppercase mb-2 text-purple-300 font-semibold">{cardLabel(project, language)}</p>
                <h3 className="text-sm font-bold uppercase">{project.title[language]}</h3>
              </div>
            </div>
          </div>
        </CardShell>
      ))}
    </div>
  );
}

/**
 * masonry-photo — one large hero (2 rows) + medium/small cards.
 */
function MasonryPhoto({ projects, language, categorySlug, onImageClick }: VariantProps) {
  const [first, ...rest] = projects;
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
      <CardShell
        project={first}
        categorySlug={categorySlug}
        onImageClick={onImageClick}
        className="col-span-4 row-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-rose-300/15 via-purple-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500 block"
      >
        <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
          <ImageWithFallback
            src={first.image}
            alt={first.title[language]}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-300/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-neutral-100">
              <p className="text-sm tracking-widest uppercase mb-2 text-rose-300 font-semibold">{cardLabel(first, language)}</p>
              <h3 className="text-lg font-bold uppercase">{first.title[language]}</h3>
            </div>
          </div>
        </div>
      </CardShell>

      {rest.map((project, index) => (
        <CardShell
          key={project.id ?? index}
          project={project}
          categorySlug={categorySlug}
          onImageClick={onImageClick}
          className="col-span-2 md:col-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-600/30 via-blue-500/20 to-orange-500/30 p-[2px] hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 block"
        >
          <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
            <ImageWithFallback
              src={project.image}
              alt={project.title[language]}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 text-neutral-100">
                <p className="text-xs tracking-widest uppercase mb-1 text-purple-400 font-semibold">{cardLabel(project, language)}</p>
                <h3 className="text-sm font-bold uppercase">{project.title[language]}</h3>
              </div>
            </div>
          </div>
        </CardShell>
      ))}
    </div>
  );
}

/**
 * masonry-6 / masonry-8 / masonry-10 — the project-page masonry grids.
 */
function Masonry({
  projects,
  language,
  categorySlug,
  onImageClick,
  colsClass,
}: VariantProps & { colsClass: string }) {
  return (
    <div className={`grid ${colsClass} gap-4`}>
      {projects.map((project, index) => {
        const span = SIZE_SPANS[project.size ?? "normal"] ?? SIZE_SPANS.normal;
        const hasRowSpan = span.includes("row-span-2");
        return (
          <CardShell
            key={project.id ?? index}
            project={project}
            categorySlug={categorySlug}
            onImageClick={onImageClick}
            className={`${span} group cursor-pointer block`}
          >
            <div
              className={`relative ${hasRowSpan ? "h-full" : "aspect-square"} bg-gradient-to-br from-purple-400/15 via-pink-300/10 to-rose-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500`}
            >
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
                <ImageWithFallback
                  src={project.image}
                  alt={project.alt[language]}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{cardLabel(project, language)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardShell>
        );
      })}
    </div>
  );
}

/** single — one contained image with its title/category overlay on hover. */
function Single({ projects, language, categorySlug, onImageClick }: VariantProps) {
  const project = projects[0];
  return (
    <div className="relative max-w-3xl mx-auto">
      <CardShell
        project={project}
        categorySlug={categorySlug}
        onImageClick={onImageClick}
        className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-400/15 via-pink-300/10 to-rose-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500 block"
      >
        <div className="relative overflow-hidden min-h-[250px] flex items-center justify-center bg-black rounded-[3px]">
          <ImageWithFallback
            src={project.image}
            alt={project.title[language]}
            className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-neutral-100">
              <p className="text-sm tracking-widest uppercase mb-2 text-purple-300 font-semibold">{cardLabel(project, language)}</p>
              <h3 className="text-lg font-bold uppercase">{project.title[language]}</h3>
            </div>
          </div>
        </div>
      </CardShell>
    </div>
  );
}
