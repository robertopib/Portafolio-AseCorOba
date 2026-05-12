import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";

// Importar las imágenes de Figma
import santaFeBrochure from "figma:asset/948f59a23fd540d4046c36f4ab1b7a97b1698104.png";
import concertBanner from "figma:asset/76f828416fc7ad72fb4f511192913809307465d8.png";
import basketballMural from "figma:asset/7ff4421de649ad1136460666ff29df586b068030.png";
import fisioterapiaCards from "figma:asset/8d4051360f9c5a7adefe677a485c2e2c7ccadb2b.png";

const marketingProjects = [
  {
    id: 1,
    title: "Brochure Corporativo",
    category: "Material Impreso - Grupo Santa Fe",
    image: santaFeBrochure
  },
  {
    id: 2,
    title: "Banner de Evento",
    category: "Publicidad Digital - Concierto",
    image: concertBanner
  },
  {
    id: 3,
    title: "Mural Deportivo",
    category: "Publicidad OOH - PAS Eagles",
    image: basketballMural
  },
  {
    id: 4,
    title: "Tarjetas de Presentación",
    category: "Branding - Fisioterapia",
    image: fisioterapiaCards
  }
];

export function Marketing360() {
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
      setSelectedImage((selectedImage + 1) % marketingProjects.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + marketingProjects.length) % marketingProjects.length);
    }
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

        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
          {language === 'es' ? 'Diseño 360°' : '360° Design'}
        </h3>
        <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
          {language === 'es' ? 'Estrategias integrales de diseño visual' : 'Comprehensive visual design strategies'}
        </p>
        <div className="mb-12 max-w-2xl">
          <p className="text-base text-neutral-100 mb-2">
            <strong>{language === 'es' ? 'Branding corporativo de:' : 'Corporate branding for:'}</strong> Barbas.Studio
          </p>
          <p className="text-sm text-purple-300 font-semibold mb-1 uppercase tracking-wide">
            {language === 'es' ? 'Mi rol' : 'My Role'}
          </p>
          <p className="text-base text-neutral-400">
            {language === 'es'
              ? 'Desarrollo de soluciones de diseño 360° en entorno profesional, adaptando identidad visual a múltiples formatos y canales de comunicación.'
              : 'Development of 360° design solutions in a professional environment, adapting visual identity to multiple formats and communication channels.'}
          </p>
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
        <div className="flex justify-center mt-12">
          <Link
            to="/proyectos/marketing-360"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
          >
            <span>{language === 'es' ? 'Ver más proyectos 360°' : 'View more 360° projects'}</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
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
      )}
    </section>
  );
}