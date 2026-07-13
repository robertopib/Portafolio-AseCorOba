import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import webApps from "../../../content/sections/web-apps.json";
import { Lightbox } from "./Lightbox";

export function WebAppDesign() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { language, t } = useLanguage();
  const designProjects = webApps.home.projects.map((p, id) => ({
    id,
    title: p.title[language],
    category: p.category[language],
    image: p.image,
  }));

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % designProjects.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + designProjects.length) % designProjects.length);
    }
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

        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
          {webApps.home.heading[language]}
        </h3>
        <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
          {webApps.home.description[language]}
        </p>
        <div className="mb-12 max-w-2xl">
          <p className="text-base text-neutral-100 mb-2">
            <strong>{t('home.studioLabel')}</strong> {webApps.home.studioName}
          </p>
          <p className="text-sm text-slate-300 font-semibold mb-1 uppercase tracking-wide">
            {t('home.roleLabel')}
          </p>
          <p className="text-base text-neutral-400">
            {webApps.home.roleDescription[language]}
          </p>
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
        <div className="flex justify-center mt-12">
          <Link
            to="/proyectos/web-apps"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
          >
            <span>{webApps.home.cta[language]}</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
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