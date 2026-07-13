import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Lightbox } from "../components/Lightbox";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import type { ProjectGalleryBlockProps, ResolvedProject, ProjectCardSize } from "./types";

/**
 * ProjectGallery block — renders a set of pre-resolved project cards in one of
 * the layout variants, reusing the exact grid JSX/classNames from the original
 * section components and project pages:
 *
 *   - 'grid-3'        → WebAppDesign / CorporateBranding home grid
 *   - 'grid-4'        → Marketing360 home grid
 *   - 'masonry-photo' → ProductPhotography home grid (1 large + mediums)
 *   - 'masonry-6'     → project-page masonry over a 6-col grid (web-apps,
 *                       photography, marketing, branding/sports)
 *   - 'masonry-8'     → project-page masonry over an 8-col grid (branding/beauty)
 *   - 'masonry-10'    → project-page masonry over a 10-col grid (branding/logos)
 *   - 'single'        → one image, contained width
 *
 * The three masonry-N variants use each card's `size` token to reproduce the
 * exact per-card col/row-span from the original pages (see SIZE_SPANS).
 *
 * All variants share one Lightbox (reusing components/Lightbox.tsx). Project
 * data (image path + localized alt/category/title + optional size) is passed in
 * via props; source/filter resolution is handled upstream by the fetch script.
 */

/**
 * Per-card size token → Tailwind col/row-span classes. The class strings encode
 * the exact spans used by the original project pages (the `md:` breakpoint
 * carries the real desktop span; the base span matches the originals' mobile
 * fallback). Grid column base is set per-variant on the wrapper.
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
export function ProjectGallery(props: ProjectGalleryBlockProps) {
  const { language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const projects: ResolvedProject[] = props.projects ?? [];

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % projects.length);
    }
  };
  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + projects.length) % projects.length);
    }
  };

  if (projects.length === 0) return null;

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {props.layoutVariant === "grid-3" && (
          <GridThree projects={projects} language={language} openLightbox={openLightbox} />
        )}
        {props.layoutVariant === "grid-4" && (
          <GridFour projects={projects} language={language} openLightbox={openLightbox} />
        )}
        {props.layoutVariant === "masonry-photo" && (
          <MasonryPhoto projects={projects} language={language} openLightbox={openLightbox} />
        )}
        {(props.layoutVariant === "masonry-6" ||
          props.layoutVariant === "masonry-8" ||
          props.layoutVariant === "masonry-10") && (
          <Masonry
            projects={projects}
            language={language}
            openLightbox={openLightbox}
            colsClass={MASONRY_COLS[props.layoutVariant]}
          />
        )}
        {props.layoutVariant === "single" && (
          <Single projects={projects} language={language} openLightbox={openLightbox} />
        )}

        {/* Lightbox Modal — shared across variants */}
        {selectedImage !== null && (
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

              <div
                className="flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <ImageWithFallback
                    src={projects[selectedImage].image}
                    alt={projects[selectedImage].alt[language]}
                    className="max-w-none max-h-[90vh] w-auto h-auto"
                  />
                  <p className="text-neutral-100 text-center mt-6 text-base absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {projects[selectedImage].alt[language]}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-3">
                {projects.map((_, index) => (
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
      </div>
    </section>
  );
}

type VariantProps = {
  projects: ResolvedProject[];
  language: "es" | "en";
  openLightbox: (index: number) => void;
};

/** grid-3 — three equal cards per row (WebAppDesign home grid). */
function GridThree({ projects, language, openLightbox }: VariantProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {projects.map((project, index) => (
        <div
          key={project.id ?? index}
          className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-slate-400/15 via-purple-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
          onClick={() => openLightbox(index)}
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
                <p className="text-sm tracking-widest uppercase mb-2 text-slate-300 font-semibold">{project.category[language]}</p>
                <h3 className="text-lg font-bold uppercase">{project.title[language]}</h3>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** grid-4 — four equal cards per row (Marketing360 home grid). */
function GridFour({ projects, language, openLightbox }: VariantProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {projects.map((project, index) => (
        <div
          key={project.id ?? index}
          className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-400/15 via-slate-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
          onClick={() => openLightbox(index)}
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
                <p className="text-xs tracking-widest uppercase mb-2 text-purple-300 font-semibold">{project.category[language]}</p>
                <h3 className="text-sm font-bold uppercase">{project.title[language]}</h3>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * masonry-photo — one large hero (2 rows) + medium/small cards
 * (ProductPhotography home grid). Uses the same spans as the original; extra
 * projects beyond the first fall back to the small card style.
 */
function MasonryPhoto({ projects, language, openLightbox }: VariantProps) {
  const [first, ...rest] = projects;
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
      {/* Imagen Grande - ocupa 4 columnas y 2 filas en desktop */}
      <div
        className="col-span-4 row-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-rose-300/15 via-purple-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
        onClick={() => openLightbox(0)}
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
              <p className="text-sm tracking-widest uppercase mb-2 text-rose-300 font-semibold">{first.category[language]}</p>
              <h3 className="text-lg font-bold uppercase">{first.title[language]}</h3>
            </div>
          </div>
        </div>
      </div>

      {rest.map((project, index) => (
        <div
          key={project.id ?? index}
          className="col-span-2 md:col-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-600/30 via-blue-500/20 to-orange-500/30 p-[2px] hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-500"
          onClick={() => openLightbox(index + 1)}
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
                <p className="text-xs tracking-widest uppercase mb-1 text-purple-400 font-semibold">{project.category[language]}</p>
                <h3 className="text-sm font-bold uppercase">{project.title[language]}</h3>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * masonry-6 / masonry-8 / masonry-10 — the project-page masonry grids. Each card
 * carries its own `size` token (mapped to the exact col/row-span via SIZE_SPANS)
 * so the layout matches the originals card-for-card. `colsClass` sets the grid
 * column base for the variant. The card overlay shows the project category, as
 * on the original project pages.
 */
function Masonry({
  projects,
  language,
  openLightbox,
  colsClass,
}: VariantProps & { colsClass: string }) {
  return (
    <div className={`grid ${colsClass} gap-4`}>
      {projects.map((project, index) => {
        const span = SIZE_SPANS[project.size ?? "normal"] ?? SIZE_SPANS.normal;
        const hasRowSpan = span.includes("row-span-2");
        return (
          <div
            key={project.id ?? index}
            className={`${span} group cursor-pointer`}
            onClick={() => openLightbox(index)}
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
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category[language]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** single — one contained image with its title/category overlay on hover. */
function Single({ projects, language, openLightbox }: VariantProps) {
  const project = projects[0];
  return (
    <div className="relative max-w-3xl mx-auto">
      <div
        className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-400/15 via-pink-300/10 to-rose-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
        onClick={() => openLightbox(0)}
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
              <p className="text-sm tracking-widest uppercase mb-2 text-purple-300 font-semibold">{project.category[language]}</p>
              <h3 className="text-lg font-bold uppercase">{project.title[language]}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
