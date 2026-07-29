import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Lightbox } from "../components/Lightbox";
import { fieldVisible } from "./contentMeta";

/**
 * CategoryGallery — a WordPress-style "query block".
 *
 * A CategoryGallery references a Categoría (taxonomy) and renders that
 * category's Proyectos (posts) in a faithful gallery layout, chosen by
 * `layoutVariant`. The card data is RESOLVED at export time from the block's
 * category ref (filtered by grupo/placement, ordered, with per-project size)
 * and emitted into content/pages.json as this block's `content.projects`. So a
 * CategoryGallery renders whatever Proyectos its category currently has —
 * editing a Proyecto (or its category assignment) changes what shows here.
 *
 * The markup for every variant is reproduced VERBATIM from the original gallery
 * renderers / home preview section components, so the design stays
 * pixel-identical; only the DATA SOURCE changed (section file -> category's
 * projects, via content/pages.json).
 *
 * PortfolioIntro (the intro heading/description/studioName/roleDescription/cta)
 * is a separate INLINE block. On the home page the intro + its curated gallery
 * historically shared one <section>; to keep that byte-identical, the home
 * layout variants render the PortfolioIntro content passed to them (via
 * `content.intro`) inside the same <section> that wraps the cards. On the
 * project pages the header is its own block and the gallery renders standalone.
 */

type LocalizedText = { es: string; en: string };

/** A resolved card, emitted by the export from a Proyecto. */
export type GalleryCard = {
  id: number;
  src: string;
  alt: LocalizedText;
  category: LocalizedText;
  title?: LocalizedText;
  size?: string | null;
  group?: string | null;
};

/** Intro content (same shape a PortfolioIntro block carries) for home variants. */
type IntroContent = {
  sectionHeading?: LocalizedText;
  heading?: LocalizedText;
  tagline?: LocalizedText;
  description?: LocalizedText;
  studioName?: string;
  roleDescription?: LocalizedText;
  cta?: LocalizedText;
  sketchImage?: string;
  sketchAlt?: LocalizedText;
};

export type CategoryGalleryContent = {
  layoutVariant: string;
  subheading?: LocalizedText;
  projects: GalleryCard[];
  intro?: IntroContent;
};

// ---------------------------------------------------------------------------
// Shared lightbox plumbing (project-page galleries). Closed-state visual — what
// the parity gate checks — is byte-identical to the original galleries.
// ---------------------------------------------------------------------------
type Img = { id: number; src: string; alt: string; category: string };

function useGalleryLightbox(images: Img[]) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage + 1) % images.length);
  };
  const prevImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage - 1 + images.length) % images.length);
  };
  return { selectedImage, setSelectedImage, openLightbox, closeLightbox, nextImage, prevImage };
}

function LightboxView({
  images,
  selectedImage,
  closeLightbox,
  nextImage,
  prevImage,
}: {
  images: Img[];
  selectedImage: number;
  closeLightbox: () => void;
  nextImage: () => void;
  prevImage: () => void;
}) {
  return (
    <Lightbox>
      <div
        className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-8 md:p-12 lg:p-16"
        onClick={closeLightbox}
      >
        <button
          onClick={closeLightbox}
          className="absolute top-6 right-6 text-neutral-100/80 hover:text-neutral-100 transition-colors z-10"
        >
          <X className="w-8 h-8" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            prevImage();
          }}
          className="absolute left-6 text-neutral-100/80 hover:text-neutral-100 transition-colors z-10"
        >
          <ChevronLeft className="w-12 h-12" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          className="absolute right-6 text-neutral-100/80 hover:text-neutral-100 transition-colors z-10"
        >
          <ChevronRight className="w-12 h-12" />
        </button>

        <div className="flex flex-col items-center justify-center flex-1 w-full" onClick={(e) => e.stopPropagation()}>
          <img
            src={images[selectedImage].src}
            alt={images[selectedImage].alt}
            className="max-w-full max-h-[calc(100vh-140px)] w-auto h-auto object-contain rounded-[3px]"
          />
          <div className="text-center mt-6">
            <p className="text-neutral-100 text-lg">{images[selectedImage].alt}</p>
            <p className="text-neutral-100/60 text-sm mt-2">
              {selectedImage + 1} / {images.length}
            </p>
          </div>
        </div>
      </div>
    </Lightbox>
  );
}

const toImgs = (cards: GalleryCard[], language: "es" | "en"): Img[] =>
  cards.map((c) => ({ id: c.id, src: c.src, alt: c.alt[language], category: c.category[language] }));

// ===========================================================================
// PROJECT-PAGE VARIANTS (standalone galleries; header is a separate block)
// ===========================================================================

/** branding:sports — masonry with fixed hero spans (from BrandingGalleryDeportes). */
function BrandingSports({ content }: { content: CategoryGalleryContent }) {
  const { language } = useLanguage();
  const sportsProjects = toImgs(content.projects, language);
  const { selectedImage, openLightbox, closeLightbox, nextImage, prevImage } =
    useGalleryLightbox(sportsProjects);

  return (
    <div className="mb-16">
      {fieldVisible(content, "subheading") && (
        <h2 className="text-xl tracking-wider uppercase text-purple-300 mb-8 font-bold">
          {content.subheading?.[language]}
        </h2>
      )}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
        {/* Hero Image - Large */}
        <div
          className="col-span-4 md:col-span-4 row-span-2 group cursor-pointer"
          onClick={() => openLightbox(0)}
        >
          <div className="relative h-full bg-gradient-to-br from-purple-400/15 via-pink-300/10 to-rose-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
            <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
              <img
                src={sportsProjects[0].src}
                alt={sportsProjects[0].alt}
                className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-neutral-100 text-base font-semibold uppercase tracking-wide">{sportsProjects[0].category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medium Image */}
        <div
          className="col-span-2 md:col-span-2 row-span-1 group cursor-pointer"
          onClick={() => openLightbox(1)}
        >
          <div className="relative aspect-square bg-gradient-to-br from-pink-300/15 via-purple-400/10 to-slate-400/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
            <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
              <img
                src={sportsProjects[1].src}
                alt={sportsProjects[1].alt}
                className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-transparent to-slate-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{sportsProjects[1].category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tall Image */}
        <div
          className="col-span-2 md:col-span-2 row-span-2 group cursor-pointer"
          onClick={() => openLightbox(2)}
        >
          <div className="relative h-full bg-gradient-to-br from-rose-300/15 via-purple-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
            <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
              <img
                src={sportsProjects[2].src}
                alt={sportsProjects[2].alt}
                className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-rose-300/20 via-transparent to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{sportsProjects[2].category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small Images */}
        {sportsProjects.slice(3).map((project, index) => (
          <div
            key={project.id}
            className="col-span-2 group cursor-pointer"
            onClick={() => openLightbox(index + 3)}
          >
            <div className="relative aspect-square bg-gradient-to-br from-slate-400/15 via-purple-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
                <img
                  src={project.src}
                  alt={project.alt}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedImage !== null && (
        <LightboxView
          images={sportsProjects}
          selectedImage={selectedImage}
          closeLightbox={closeLightbox}
          nextImage={nextImage}
          prevImage={prevImage}
        />
      )}
    </div>
  );
}

/**
 * branding:beauty — Adriana Muñoz + Ana Grace combined masonry (from
 * BrandingGalleryBelleza). Historically two source arrays interleaved; here the
 * export emits the SAME two groups so this variant carries BOTH, split by the
 * `group` field on each card (adrianaMunoz / anaGrace).
 */
function BrandingBeauty({ content }: { content: CategoryGalleryContent }) {
  const { language } = useLanguage();
  const adrianaMunozProjects = toImgs(
    content.projects.filter((c) => c.group === "adrianaMunoz"),
    language,
  );
  const anaGraceProjects = toImgs(
    content.projects.filter((c) => c.group === "anaGrace"),
    language,
  );

  const galleryImages = [
    adrianaMunozProjects[0],
    adrianaMunozProjects[1],
    ...anaGraceProjects,
    ...adrianaMunozProjects.slice(2),
  ];
  const { selectedImage, openLightbox, closeLightbox, nextImage, prevImage } =
    useGalleryLightbox(galleryImages);
  const anaGraceStart = 2;
  const adrianaRestStart = 2 + anaGraceProjects.length;

  return (
    <div>
      {fieldVisible(content, "subheading") && (
        <h2 className="text-xl tracking-wider uppercase text-pink-300 mb-8 font-bold">
          {content.subheading?.[language]}
        </h2>
      )}

      {/* Masonry Grid Combinado */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-12">
        {/* Wide Hero */}
        <div
          className="col-span-4 md:col-span-5 row-span-2 group cursor-pointer"
          onClick={() => openLightbox(0)}
        >
          <div className="relative h-full bg-gradient-to-br from-pink-300/15 via-purple-400/10 to-slate-400/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
            <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
              <img
                src={adrianaMunozProjects[0].src}
                alt={adrianaMunozProjects[0].alt}
                className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-transparent to-slate-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-neutral-100 text-base font-semibold uppercase tracking-wide">{adrianaMunozProjects[0].category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tall on right */}
        <div
          className="col-span-2 md:col-span-3 row-span-2 group cursor-pointer"
          onClick={() => openLightbox(1)}
        >
          <div className="relative h-full bg-gradient-to-br from-purple-400/15 via-pink-300/10 to-rose-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
            <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
              <img
                src={adrianaMunozProjects[1].src}
                alt={adrianaMunozProjects[1].alt}
                className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{adrianaMunozProjects[1].category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medium images - Ana Grace and more */}
        {anaGraceProjects.map((project, index) => (
          <div
            key={project.id}
            className="col-span-2 group cursor-pointer"
            onClick={() => openLightbox(anaGraceStart + index)}
          >
            <div className="relative aspect-square bg-gradient-to-br from-rose-300/15 via-purple-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
                <img
                  src={project.src}
                  alt={project.alt}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-rose-300/20 via-transparent to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Remaining Adriana Muñoz images */}
        {adrianaMunozProjects.slice(2).map((project, index) => (
          <div
            key={project.id}
            className={index % 3 === 0 ? "col-span-4 md:col-span-3" : "col-span-2"}
            onClick={() => openLightbox(adrianaRestStart + index)}
          >
            <div className="relative aspect-square bg-gradient-to-br from-slate-400/15 via-purple-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
                <img
                  src={project.src}
                  alt={project.alt}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-transparent to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedImage !== null && (
        <LightboxView
          images={galleryImages}
          selectedImage={selectedImage}
          closeLightbox={closeLightbox}
          nextImage={nextImage}
          prevImage={prevImage}
        />
      )}
    </div>
  );
}

/** branding:logos — logos grid (from BrandingGalleryLogos). */
function BrandingLogos({ content }: { content: CategoryGalleryContent }) {
  const { language } = useLanguage();
  const logoProjects = toImgs(content.projects, language);
  const { selectedImage, openLightbox, closeLightbox, nextImage, prevImage } =
    useGalleryLightbox(logoProjects);

  return (
    <div className="mt-16">
      <h2 className="text-xl tracking-wider uppercase text-slate-300 mb-8 font-bold">Logos</h2>
      <div className="grid grid-cols-4 md:grid-cols-10 gap-4">
        {logoProjects.map((project, index) => (
          <div
            key={project.id}
            className={index === 0 ? "col-span-4 md:col-span-4 row-span-2" : "col-span-2"}
            onClick={() => openLightbox(index)}
          >
            <div className="relative h-full bg-gradient-to-br from-slate-400/15 via-purple-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500 group cursor-pointer">
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden flex items-center justify-center p-6">
                <img
                  src={project.src}
                  alt={project.alt}
                  className="max-w-full max-h-full object-contain group-hover:scale-110 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-transparent to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedImage !== null && (
        <LightboxView
          images={logoProjects}
          selectedImage={selectedImage}
          closeLightbox={closeLightbox}
          nextImage={nextImage}
          prevImage={prevImage}
        />
      )}
    </div>
  );
}

/** web-apps page gallery (from WebAppGallery). */
function WebAppsPage({ content }: { content: CategoryGalleryContent }) {
  const { language } = useLanguage();
  const webAppProjects = toImgs(content.projects, language);
  const { selectedImage, openLightbox, closeLightbox, nextImage, prevImage } =
    useGalleryLightbox(webAppProjects);

  return (
    <>
      {/* Masonry Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
        {webAppProjects.map((project, index) => (
          <div
            key={project.id}
            className={`group cursor-pointer ${
              index === 0 ? 'col-span-4 md:col-span-4 row-span-2' :
              index === 1 ? 'col-span-2 md:col-span-3 row-span-2' :
              'col-span-2 md:col-span-3'
            }`}
            onClick={() => openLightbox(index)}
          >
            <div className="relative h-full bg-gradient-to-br from-slate-400/15 via-purple-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
                <img
                  src={project.src}
                  alt={project.alt}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage !== null && (
        <LightboxView
          images={webAppProjects}
          selectedImage={selectedImage}
          closeLightbox={closeLightbox}
          nextImage={nextImage}
          prevImage={prevImage}
        />
      )}
    </>
  );
}

/** fotografia page gallery (from PhotographyGallery). */
function PhotographyPage({ content }: { content: CategoryGalleryContent }) {
  const { language } = useLanguage();
  const productProjects = toImgs(content.projects, language);
  const { selectedImage, openLightbox, closeLightbox, nextImage, prevImage } =
    useGalleryLightbox(productProjects);

  return (
    <>
      {/* Masonry Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
        {productProjects.map((project, index) => (
          <div
            key={project.id}
            className={`group cursor-pointer ${
              index === 0 ? 'col-span-4 md:col-span-4 row-span-2' :
              index === 1 ? 'col-span-2 md:col-span-2 row-span-1' :
              index === 2 ? 'col-span-2 md:col-span-3 row-span-2' :
              index === 3 ? 'col-span-2 md:col-span-3' :
              index === 4 ? 'col-span-4 md:col-span-5 row-span-2' :
              index === 5 ? 'col-span-2 md:col-span-3 row-span-2' :
              index === 6 ? 'col-span-2 md:col-span-2' :
              index === 7 ? 'col-span-2 md:col-span-4' :
              'col-span-2'
            }`}
            onClick={() => openLightbox(index)}
          >
            <div className="relative h-full bg-gradient-to-br from-rose-300/15 via-purple-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
                <img
                  src={project.src}
                  alt={project.alt}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-rose-300/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage !== null && (
        <LightboxView
          images={productProjects}
          selectedImage={selectedImage}
          closeLightbox={closeLightbox}
          nextImage={nextImage}
          prevImage={prevImage}
        />
      )}
    </>
  );
}

/** marketing page gallery (from MarketingGallery). */
function MarketingPage({ content }: { content: CategoryGalleryContent }) {
  const { language } = useLanguage();
  const marketing360Projects = toImgs(content.projects, language);
  const { selectedImage, openLightbox, closeLightbox, nextImage, prevImage } =
    useGalleryLightbox(marketing360Projects);

  return (
    <>
      {/* Masonry Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
        {marketing360Projects.map((project, index) => (
          <div
            key={project.id}
            className={`group cursor-pointer ${
              index === 0 ? 'col-span-4 md:col-span-4 row-span-2' :
              index === 1 ? 'col-span-2 md:col-span-2 row-span-2' :
              'col-span-2 md:col-span-3'
            }`}
            onClick={() => openLightbox(index)}
          >
            <div className="relative h-full bg-gradient-to-br from-purple-400/15 via-slate-400/10 to-pink-300/10 p-[2px] rounded-[3px] overflow-hidden hover:shadow-2xl hover:shadow-xl transition-all duration-500">
              <div className="relative w-full h-full bg-black rounded-[3px] overflow-hidden">
                <img
                  src={project.src}
                  alt={project.alt}
                  className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-slate-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-neutral-100 text-sm font-semibold uppercase tracking-wide">{project.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage !== null && (
        <LightboxView
          images={marketing360Projects}
          selectedImage={selectedImage}
          closeLightbox={closeLightbox}
          nextImage={nextImage}
          prevImage={prevImage}
        />
      )}
    </>
  );
}

// ===========================================================================
// HOME VARIANTS — reproduce the original preview <section> VERBATIM.
// These render the PortfolioIntro content (content.intro) inline in the same
// <section> that wraps the curated gallery + "ver más" CTA, exactly as the
// original CorporateBranding / WebAppDesign / etc. section components did, so
// the home page stays byte-identical.
// ===========================================================================

/** branding home preview (from CorporateBranding). */
function BrandingHome({ content }: { content: CategoryGalleryContent }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { language, t } = useLanguage();
  const intro = content.intro ?? {};

  const brandingImages = content.projects.map((c) => ({
    id: c.id,
    src: c.src,
    alt: c.alt[language],
  }));

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage + 1) % brandingImages.length);
  };
  const prevImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage - 1 + brandingImages.length) % brandingImages.length);
  };

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden" id="work">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-neutral-500">02</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        {fieldVisible(intro, "sectionHeading") && (
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
              {intro.sectionHeading?.[language]}
            </h2>
          </div>
        )}

        {fieldVisible(intro, "heading") && (
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {intro.heading?.[language]}
          </h3>
        )}
        {fieldVisible(intro, "description") && (
          <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
            {intro.description?.[language]}
          </p>
        )}

        {/* Barbas.Studio Info */}
        <div className="mb-12 max-w-2xl">
          {fieldVisible(intro, "studioName") && (
            <p className="text-base text-neutral-100 mb-2">
              <strong>{t('home.studioLabel')}</strong> {intro.studioName}
            </p>
          )}
          {fieldVisible(intro, "roleDescription") && (
            <>
              <p className="text-sm text-pink-300 font-semibold mb-1 uppercase tracking-wide">
                {t('home.roleLabel')}
              </p>
              <p className="text-base text-neutral-400">
                {intro.roleDescription?.[language]}
              </p>
            </>
          )}
        </div>

        {/* Gallery Container */}
        <div className="relative max-w-5xl mx-auto">

          {/* Grid Gallery - Solo 3 imágenes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tres imágenes en grid */}
            {brandingImages.slice(2, 5).map((image, index) => (
              <div
                key={image.id}
                className="group relative rounded-[3px] cursor-pointer overflow-hidden bg-gradient-to-br from-purple-400/15 via-pink-300/10 to-rose-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
                onClick={() => openLightbox(index + 2)}
              >
                <div className="relative overflow-hidden min-h-[250px] flex items-center justify-center bg-black rounded-[3px]">
                  <ImageWithFallback
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-neutral-100">
                      <p className="text-sm font-semibold">{image.alt}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ver más proyectos Button */}
          {fieldVisible(intro, "cta") && (
            <div className="flex justify-center mt-12">
              <Link
                to="/proyectos/branding"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
              >
                <span>{intro.cta?.[language]}</span>
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {selectedImage !== null && (
          <Lightbox>
          <div
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-neutral-100 p-3 rounded-[3px] transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Next Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <ImageWithFallback
                  src={brandingImages[selectedImage].src}
                  alt={brandingImages[selectedImage].alt}
                  className="max-w-none max-h-[90vh] w-auto h-auto"
                />
                <p className="text-neutral-100 text-center mt-6 text-base absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  {brandingImages[selectedImage].alt}
                </p>
              </div>
            </div>

            {/* Dots Navigation */}
            <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-3">
              {brandingImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === selectedImage ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
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

/** web-apps home preview (from WebAppDesign). */
function WebAppsHome({ content }: { content: CategoryGalleryContent }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { language, t } = useLanguage();
  const intro = content.intro ?? {};
  const designProjects = content.projects.map((c) => ({
    id: c.id,
    title: (c.title ?? c.alt)[language],
    category: c.category[language],
    image: c.src,
  }));

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage + 1) % designProjects.length);
  };
  const prevImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage - 1 + designProjects.length) % designProjects.length);
  };

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-gradient-to-br from-slate-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-tl from-purple-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-neutral-500">03</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        {fieldVisible(intro, "heading") && (
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {intro.heading?.[language]}
          </h3>
        )}
        {fieldVisible(intro, "description") && (
          <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
            {intro.description?.[language]}
          </p>
        )}
        <div className="mb-12 max-w-2xl">
          {fieldVisible(intro, "studioName") && (
            <p className="text-base text-neutral-100 mb-2">
              <strong>{t('home.studioLabel')}</strong> {intro.studioName}
            </p>
          )}
          {fieldVisible(intro, "roleDescription") && (
            <>
              <p className="text-sm text-slate-300 font-semibold mb-1 uppercase tracking-wide">
                {t('home.roleLabel')}
              </p>
              <p className="text-base text-neutral-400">
                {intro.roleDescription?.[language]}
              </p>
            </>
          )}
        </div>

        {/* Grid de 3 columnas con el mismo tamaño */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {designProjects.map((project, index) => (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-slate-400/15 via-purple-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
              onClick={() => openLightbox(index)}
            >
              <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
                <ImageWithFallback
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-neutral-100">
                    <p className="text-sm tracking-widest uppercase mb-2 text-slate-300 font-semibold">{project.category}</p>
                    <h3 className="text-lg font-bold uppercase">{project.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ver más proyectos Button */}
        {fieldVisible(intro, "cta") && (
          <div className="flex justify-center mt-12">
            <Link
              to="/proyectos/web-apps"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
            >
              <span>{intro.cta?.[language]}</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <Lightbox>
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-neutral-100 p-3 rounded-[3px] transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Image Container */}
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={designProjects[selectedImage].image}
                alt={designProjects[selectedImage].title}
                className="max-w-none max-h-[90vh] w-auto h-auto"
              />
              <div className="text-neutral-100 text-center mt-6 absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <p className="text-violet-400 text-base tracking-widest uppercase mb-2">
                  {designProjects[selectedImage].category}
                </p>
                <h3 className="text-neutral-100 text-2xl">
                  {designProjects[selectedImage].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-3">
            {designProjects.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(index);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === selectedImage ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
        </Lightbox>
      )}
    </section>
  );
}

/** uxui home preview (from UXUIProduct) — single sketch image + intro. */
function UxuiHome({ content }: { content: CategoryGalleryContent }) {
  const { language, t } = useLanguage();
  const intro = content.intro ?? {};

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-neutral-500">04</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        {fieldVisible(intro, "heading") && (
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {intro.heading?.[language]}
          </h3>
        )}
        {fieldVisible(intro, "tagline") && (
          <p className="text-xl md:text-2xl text-pink-300 mb-6 italic font-semibold">
            {intro.tagline?.[language]}
          </p>
        )}
        {fieldVisible(intro, "description") && (
          <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
            {intro.description?.[language]}
          </p>
        )}
        <div className="mb-12 max-w-2xl">
          {fieldVisible(intro, "studioName") && (
            <p className="text-base text-neutral-100 mb-2">
              <strong>{t('home.studioLabel')}</strong> {intro.studioName}
            </p>
          )}
          {fieldVisible(intro, "roleDescription") && (
            <>
              <p className="text-sm text-pink-300 font-semibold mb-1 uppercase tracking-wide">
                {t('home.roleLabel')}
              </p>
              <p className="text-base text-neutral-400">
                {intro.roleDescription?.[language]}
              </p>
            </>
          )}
        </div>

        {/* Imagen horizontal única */}
        {fieldVisible(intro, "sketchImage") && (
          <div className="mb-12">
            <div className="group relative rounded-[3px] overflow-hidden bg-gradient-to-br from-pink-300/15 via-rose-300/10 to-purple-400/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500">
              <div className="relative overflow-hidden bg-black rounded-[3px]" style={{ height: '300px' }}>
                <ImageWithFallback
                  src={intro.sketchImage ?? ""}
                  alt={intro.sketchAlt?.[language] ?? ""}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
        )}

        {/* Ver más proyectos Button */}
        {fieldVisible(intro, "cta") && (
          <div className="flex justify-center mt-12">
            <Link
              to="/proyectos/uxui-producto"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-300 to-rose-300 hover:from-fuchsia-500 hover:to-orange-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
            >
              <span>{intro.cta?.[language]}</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/** fotografia home preview (from ProductPhotography). */
function PhotographyHome({ content }: { content: CategoryGalleryContent }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { language, t } = useLanguage();
  const intro = content.intro ?? {};
  const products = content.projects.map((c) => ({
    id: c.id,
    title: (c.title ?? c.alt)[language],
    category: c.category[language],
    image: c.src,
  }));

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage + 1) % products.length);
  };
  const prevImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage - 1 + products.length) % products.length);
  };

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-rose-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-tl from-purple-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-neutral-500">05</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        {fieldVisible(intro, "heading") && (
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {intro.heading?.[language]}
          </h3>
        )}
        {fieldVisible(intro, "description") && (
          <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
            {intro.description?.[language]}
          </p>
        )}
        <div className="mb-12 max-w-2xl">
          {fieldVisible(intro, "studioName") && (
            <p className="text-base text-neutral-100 mb-2">
              <strong>{t('home.studioLabel')}</strong> {intro.studioName}
            </p>
          )}
          {fieldVisible(intro, "roleDescription") && (
            <>
              <p className="text-sm text-rose-300 font-semibold mb-1 uppercase tracking-wide">
                {t('home.roleLabel')}
              </p>
              <p className="text-base text-neutral-400">
                {intro.roleDescription?.[language]}
              </p>
            </>
          )}
        </div>

        {/* Layout: 1 grande, 2 medianas, 2 pequeñas */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {/* Imagen Grande - ocupa 4 columnas y 2 filas en desktop */}
          <div
            className="col-span-4 row-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-rose-300/15 via-purple-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
            onClick={() => openLightbox(0)}
          >
            <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
              <img
                src={products[0].image}
                alt={products[0].title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-rose-300/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-neutral-100">
                  <p className="text-sm tracking-widest uppercase mb-2 text-rose-300 font-semibold">{products[0].category}</p>
                  <h3 className="text-lg font-bold uppercase">{products[0].title}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen Mediana 1 - ocupa 2 columnas */}
          <div
            className="col-span-2 md:col-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-600/30 via-blue-500/20 to-orange-500/30 p-[2px] hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-500"
            onClick={() => openLightbox(1)}
          >
            <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
              <img
                src={products[1].image}
                alt={products[1].title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-neutral-100">
                  <p className="text-xs tracking-widest uppercase mb-1 text-purple-400 font-semibold">{products[1].category}</p>
                  <h3 className="text-sm font-bold uppercase">{products[1].title}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen Mediana 2 - ocupa 2 columnas */}
          <div
            className="col-span-2 md:col-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-fuchsia-600/30 via-orange-500/20 to-purple-500/30 p-[2px] hover:shadow-2xl hover:shadow-fuchsia-500/50 transition-all duration-500"
            onClick={() => openLightbox(3)}
          >
            <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
              <img
                src={products[3].image}
                alt={products[3].title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-neutral-100">
                  <p className="text-xs tracking-widest uppercase mb-1 text-fuchsia-400 font-semibold">{products[3].category}</p>
                  <h3 className="text-sm font-bold uppercase">{products[3].title}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen Pequeña 1 - ocupa 2 columnas */}
          <div
            className="col-span-2 md:col-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-blue-600/30 via-purple-500/20 to-fuchsia-500/30 p-[2px] hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-500"
            onClick={() => openLightbox(4)}
          >
            <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
              <img
                src={products[4].image}
                alt={products[4].title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 via-transparent to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-neutral-100">
                  <p className="text-xs tracking-widest uppercase mb-1 text-blue-400 font-semibold">{products[4].category}</p>
                  <h3 className="text-xs font-bold uppercase">{products[4].title}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen Pequeña 2 - ocupa 2 columnas */}
          <div
            className="col-span-2 md:col-span-2 group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-orange-600/30 via-purple-500/20 to-blue-500/30 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
            onClick={() => openLightbox(5)}
          >
            <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
              <img
                src={products[5].image}
                alt={products[5].title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-rose-300/20 via-transparent to-slate-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-neutral-100">
                  <p className="text-xs tracking-widest uppercase mb-1 text-rose-300 font-semibold">{products[5].category}</p>
                  <h3 className="text-xs font-bold uppercase">{products[5].title}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ver más proyectos Button */}
        {fieldVisible(intro, "cta") && (
          <div className="flex justify-center mt-12">
            <Link
              to="/proyectos/fotografia-producto"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
            >
              <span>{intro.cta?.[language]}</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <Lightbox>
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-neutral-100 p-3 rounded-[3px] transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Image Container */}
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={products[selectedImage].image}
                alt={products[selectedImage].title}
                className="max-w-none max-h-[90vh] w-auto h-auto"
              />
              <div className="text-neutral-100 text-center mt-6 absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <p className="text-violet-400 text-base tracking-widest uppercase mb-2">
                  {products[selectedImage].category}
                </p>
                <h3 className="text-neutral-100 text-2xl">
                  {products[selectedImage].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-3">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(index);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === selectedImage ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
        </Lightbox>
      )}
    </section>
  );
}

/** marketing home preview (from Marketing360). */
function MarketingHome({ content }: { content: CategoryGalleryContent }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { language, t } = useLanguage();
  const intro = content.intro ?? {};
  const marketingProjects = content.projects.map((c) => ({
    id: c.id,
    title: (c.title ?? c.alt)[language],
    category: c.category[language],
    image: c.src,
  }));

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage + 1) % marketingProjects.length);
  };
  const prevImage = () => {
    if (selectedImage !== null) setSelectedImage((selectedImage - 1 + marketingProjects.length) % marketingProjects.length);
  };

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-tl from-slate-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-neutral-500">06</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        {fieldVisible(intro, "heading") && (
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {intro.heading?.[language]}
          </h3>
        )}
        {fieldVisible(intro, "description") && (
          <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
            {intro.description?.[language]}
          </p>
        )}
        <div className="mb-12 max-w-2xl">
          {fieldVisible(intro, "studioName") && (
            <p className="text-base text-neutral-100 mb-2">
              <strong>{t('home.studioLabel')}</strong> {intro.studioName}
            </p>
          )}
          {fieldVisible(intro, "roleDescription") && (
            <>
              <p className="text-sm text-purple-300 font-semibold mb-1 uppercase tracking-wide">
                {t('home.roleLabel')}
              </p>
              <p className="text-base text-neutral-400">
                {intro.roleDescription?.[language]}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {marketingProjects.map((project, index) => (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-[3px] cursor-pointer bg-gradient-to-br from-purple-400/15 via-slate-400/10 to-pink-300/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500"
              onClick={() => openLightbox(index)}
            >
              <div className="aspect-square relative overflow-hidden bg-black rounded-[3px]">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-slate-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-neutral-100">
                    <p className="text-xs tracking-widest uppercase mb-2 text-purple-300 font-semibold">{project.category}</p>
                    <h3 className="text-sm font-bold uppercase">{project.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ver más proyectos Button */}
        {fieldVisible(intro, "cta") && (
          <div className="flex justify-center mt-12">
            <Link
              to="/proyectos/marketing-360"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
            >
              <span>{intro.cta?.[language]}</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <Lightbox>
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-neutral-100 p-3 rounded-[3px] transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-violet-600 hover:text-neutral-100 text-neutral-100 p-4 rounded-[3px] transition-all duration-300"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Image Container */}
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={marketingProjects[selectedImage].image}
                alt={marketingProjects[selectedImage].title}
                className="max-w-none max-h-[90vh] w-auto h-auto"
              />
              <div className="text-neutral-100 text-center mt-6 absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <p className="text-violet-400 text-base tracking-widest uppercase mb-2">
                  {marketingProjects[selectedImage].category}
                </p>
                <h3 className="text-neutral-100 text-2xl">
                  {marketingProjects[selectedImage].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-3">
            {marketingProjects.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(index);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === selectedImage ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
        </Lightbox>
      )}
    </section>
  );
}

// ===========================================================================
// Dispatcher
// ===========================================================================
const VARIANTS: Record<string, (props: { content: CategoryGalleryContent }) => JSX.Element> = {
  "branding:sports": BrandingSports,
  "branding:beauty": BrandingBeauty,
  "branding:logos": BrandingLogos,
  "web-apps:page": WebAppsPage,
  "fotografia:page": PhotographyPage,
  "marketing:page": MarketingPage,
  "branding:home": BrandingHome,
  "web-apps:home": WebAppsHome,
  "uxui:home": UxuiHome,
  "fotografia:home": PhotographyHome,
  "marketing:home": MarketingHome,
};

export function CategoryGallery({ content }: { content?: CategoryGalleryContent }) {
  if (!content) return null;
  const Variant = VARIANTS[content.layoutVariant];
  if (!Variant) return null;
  return <Variant content={content} />;
}

/**
 * PortfolioIntro — the inline intro (heading/description/studioName/
 * roleDescription/cta, edited in place) for a home preview.
 *
 * On the HOME page the intro historically shared one <section> with its curated
 * gallery. To keep that byte-identical, the paired home CategoryGallery draws
 * the intro (the export copies this block's content onto the gallery's
 * `content.intro`), so this block renders NOTHING on its own — it exists purely
 * as the in-place editing surface for the intro copy. It carries `anchorId` so
 * the section anchor still lives here in the block list.
 */
export function PortfolioIntro() {
  return null;
}
