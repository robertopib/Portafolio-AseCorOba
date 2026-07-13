import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Lightbox } from "../components/Lightbox";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import type { ProjectGalleryBlockProps, ResolvedProject } from "./types";

/**
 * ProjectGallery block — renders a set of pre-resolved project cards in one of
 * the five layout variants, reusing the exact grid JSX/classNames from the
 * original section components and project pages:
 *
 *   - 'grid-3'          → WebAppDesign / CorporateBranding home grid
 *   - 'grid-4'          → Marketing360 home grid
 *   - 'masonry-photo'   → ProductPhotography home grid (1 large + mediums)
 *   - 'masonry-branding'→ BrandingProjects sports masonry grid
 *   - 'single'          → one image, contained width
 *
 * All variants share one Lightbox (reusing components/Lightbox.tsx). Project
 * data (image path + localized alt/category/title) is passed in via props;
 * source/filter resolution is handled upstream by the fetch script.
 */
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
        {props.layoutVariant === "masonry-branding" && (
          <MasonryBranding projects={projects} language={language} openLightbox={openLightbox} />
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
 * masonry-branding — large hero (col-span-4, row-span-2) + medium/tall cards
 * (BrandingProjects sports masonry grid). First three use the distinct
 * large/medium/tall spans; remaining cards fall back to square medium cards.
 */
function MasonryBranding({ projects, language, openLightbox }: VariantProps) {
  const spans = [
    "col-span-4 md:col-span-4 row-span-2",
    "col-span-2 md:col-span-2 row-span-1",
    "col-span-2 md:col-span-2 row-span-2",
  ];
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
      {projects.map((project, index) => (
        <div
          key={project.id ?? index}
          className={`${spans[index] ?? "col-span-2"} group cursor-pointer`}
          onClick={() => openLightbox(index)}
        >
          <div className="relative h-full aspect-square bg-gradient-to-br from-purple-400/15 via-pink-300/10 to-rose-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
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
      ))}
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
