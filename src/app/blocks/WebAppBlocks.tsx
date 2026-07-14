import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import webApps from "../../../content/sections/web-apps.json";
import { GalleryLightbox, useGalleryLightbox } from "./galleryShared";

/**
 * Web & App project page blocks. Header + gallery extracted VERBATIM from
 * src/app/pages/WebAppProjects.tsx. Data from content/sections/web-apps.json.
 */

export function WebAppHeader() {
  const { language, t } = useLanguage();
  return (
    <div className="mb-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-300 hover:text-blue-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm tracking-wider uppercase font-semibold">
          {t('nav.back')}
        </span>
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <span className="text-base tracking-widest uppercase text-neutral-500">03</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>

      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
        {webApps.page.title[language]}
      </h1>
      <p className="text-base text-neutral-300 max-w-3xl">
        {webApps.page.description[language]}
      </p>
    </div>
  );
}

export function WebAppGallery() {
  const { language } = useLanguage();
  const webAppProjects = webApps.page.projects.map((p, id) => ({
    id,
    src: p.image,
    alt: p.alt[language],
    category: p.category[language],
  }));
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
        <GalleryLightbox
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
