import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import photography from "../../../content/sections/photography.json";
import { Lightbox } from "./Lightbox";

export function ProductPhotography() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { language, t } = useLanguage();
  const products = photography.home.projects.map((p, id) => ({
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
      setSelectedImage((selectedImage + 1) % products.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + products.length) % products.length);
    }
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

        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
          {photography.home.heading[language]}
        </h3>
        <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
          {photography.home.description[language]}
        </p>
        <div className="mb-12 max-w-2xl">
          <p className="text-base text-neutral-100 mb-2">
            <strong>{t('home.studioLabel')}</strong> {photography.home.studioName}
          </p>
          <p className="text-sm text-rose-300 font-semibold mb-1 uppercase tracking-wide">
            {t('home.roleLabel')}
          </p>
          <p className="text-base text-neutral-400">
            {photography.home.roleDescription[language]}
          </p>
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
        <div className="flex justify-center mt-12">
          <Link
            to="/proyectos/fotografia-producto"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
          >
            <span>{photography.home.cta[language]}</span>
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