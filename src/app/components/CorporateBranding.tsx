import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";

// Importar las imágenes correctamente
import wodfest1 from "figma:asset/25e9467c4a5ed8a5438a741b2b6c73115fc4554c.png";
import wodfest2 from "figma:asset/a8198d99a2383d3dc8005422e6c483014ec215fe.png";
import adrianaMunoz from "figma:asset/334fe9a7bb579717d2294738e06927cda7ba71a4.png";
import fisioEquina from "figma:asset/260336305dc5a6d4cceb2f9f7452a687a85b3036.png";
import anaGrace from "figma:asset/d705e68558f43f7321e71ebf82bad319ce1c7b72.png";

const brandingImages = [
  { id: 1, src: wodfest1, alt: "WodFest Costa Rica - Campaña publicitaria" },
  { id: 2, src: wodfest2, alt: "WodFest Costa Rica - Diseño de marca" },
  { id: 3, src: adrianaMunoz, alt: "Adriana Muñoz - Contenido para redes sociales" },
  { id: 4, src: fisioEquina, alt: "FisioEquina - Social media marketing" },
  { id: 5, src: anaGrace, alt: "Ana Grace Salon & Estética - Branding digital" },
];

export function CorporateBranding() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { language } = useLanguage();

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % brandingImages.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + brandingImages.length) % brandingImages.length);
    }
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

        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {language === 'es' ? 'Proyectos' : 'Projects'}
          </h2>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
          {language === 'es' ? 'Branding corporativo' : 'Corporate Branding'}
        </h3>
        <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
          {language === 'es'
            ? 'Desarrollo de piezas gráficas para canales digitales'
            : 'Graphic design development for digital channels'}
        </p>

        {/* Barbas.Studio Info */}
        <div className="mb-12 max-w-2xl">
          <p className="text-base text-neutral-100 mb-2">
            <strong>{language === 'es' ? 'Branding corporativo de:' : 'Corporate branding for:'}</strong> Barbas.Studio
          </p>
          <p className="text-sm text-pink-300 font-semibold mb-1 uppercase tracking-wide">
            {language === 'es' ? 'Mi rol' : 'My Role'}
          </p>
          <p className="text-base text-neutral-400">
            {language === 'es'
              ? 'Dirección de arte, conceptualización y fotografía'
              : 'Art direction, conceptualization and photography'}
          </p>
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
          <div className="flex justify-center mt-12">
            <Link
              to="/proyectos/branding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
            >
              <span>{language === 'es' ? 'Ver más proyectos de branding' : 'View more branding projects'}</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Lightbox Modal */}
        {selectedImage !== null && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
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
        )}
      </div>
    </section>
  );
}