import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Lightbox } from "../components/Lightbox";
import { fieldVisible } from "./contentMeta";
import branding from "../../../content/sections/branding.json";

/**
 * Branding project page, decomposed into page-composed blocks that each
 * reproduce their sub-section's ORIGINAL markup VERBATIM (from
 * src/app/pages/BrandingProjects.tsx). Data still comes from
 * content/sections/branding.json.
 *
 * Per-gallery lightbox cycling is used (each gallery block manages its own
 * lightbox over its own image set). The closed-state visual — what the parity
 * gate checks — is byte-identical to the original.
 */

type GalleryImage = { id: number; src: string; alt: string; category: string };

function useGalleryLightbox(images: GalleryImage[]) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length);
    }
  };
  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + images.length) % images.length);
    }
  };
  return { selectedImage, openLightbox, closeLightbox, nextImage, prevImage };
}

function LightboxView({
  images,
  selectedImage,
  closeLightbox,
  nextImage,
  prevImage,
}: {
  images: GalleryImage[];
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

/** Header block: back link + section index + title + description. */
type LocalizedText = { es: string; en: string };
type HeaderContent = {
  backLabel?: LocalizedText;
  sectionNumber: string;
  title: LocalizedText;
  description: LocalizedText;
};

export function BrandingHeader({ content }: { content?: HeaderContent }) {
  const { language, t } = useLanguage();
  const sectionNumber = content?.sectionNumber ?? "02";
  const title = content?.title ?? branding.page.title;
  const description = content?.description ?? branding.page.description;
  const backLabel = content?.backLabel ? content.backLabel[language] : t('nav.back');
  return (
    <div className="mb-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm tracking-wider uppercase font-semibold">
          {backLabel}
        </span>
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <span className="text-base tracking-widest uppercase text-neutral-500">{sectionNumber}</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>

      {fieldVisible(content, "title") && (
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
          {title[language]}
        </h1>
      )}
      {fieldVisible(content, "description") && (
        <p className="text-base text-neutral-300 max-w-3xl">
          {description[language]}
        </p>
      )}
    </div>
  );
}

/** Sports/Fitness gallery (subheading + masonry with fixed hero spans). */
export function BrandingGalleryDeportes() {
  const { language } = useLanguage();
  const sportsProjects = branding.page.sportsProjects.map((p) => ({
    id: p.id,
    src: p.src,
    alt: p.alt[language],
    category: p.category[language],
  }));
  const { selectedImage, openLightbox, closeLightbox, nextImage, prevImage } =
    useGalleryLightbox(sportsProjects);

  return (
    <div className="mb-16">
      <h2 className="text-xl tracking-wider uppercase text-purple-300 mb-8 font-bold">
        {branding.page.subtitleSports[language]}
      </h2>
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

/** Beauty/aesthetics gallery (Adriana Muñoz + Ana Grace, combined masonry). */
export function BrandingGalleryBelleza() {
  const { language } = useLanguage();
  const adrianaMunozProjects = branding.page.adrianaMunozProjects.map((p) => ({
    id: p.id,
    src: p.src,
    alt: p.alt[language],
    category: p.category[language],
  }));
  const anaGraceProjects = branding.page.anaGraceProjects.map((p) => ({
    id: p.id,
    src: p.src,
    alt: p.alt[language],
    category: p.category[language],
  }));

  // Per-gallery lightbox order matches the original visual order of this
  // sub-section: Adriana[0], Adriana[1], AnaGrace..., Adriana[2..].
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
      <h2 className="text-xl tracking-wider uppercase text-pink-300 mb-8 font-bold">
        {branding.page.subtitleBeauty[language]}
      </h2>

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

/** Logos gallery. */
export function BrandingGalleryLogos() {
  const { language } = useLanguage();
  const logoProjects = branding.page.logoProjects.map((p) => ({
    id: p.id,
    src: p.src,
    alt: p.alt[language],
    category: p.category[language],
  }));
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
