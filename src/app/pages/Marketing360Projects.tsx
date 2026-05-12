import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Importar las imágenes existentes
import santaFeBrochure from "figma:asset/948f59a23fd540d4046c36f4ab1b7a97b1698104.png";
import concertBanner from "figma:asset/76f828416fc7ad72fb4f511192913809307465d8.png";
import basketballMural from "figma:asset/7ff4421de649ad1136460666ff29df586b068030.png";
import fisioterapiaCards from "figma:asset/8d4051360f9c5a7adefe677a485c2e2c7ccadb2b.png";

const marketing360Projects = [
  { id: 1, src: santaFeBrochure, alt: "Brochure Corporativo - Grupo Santa Fe", category: "Material Impreso" },
  { id: 2, src: concertBanner, alt: "Banner de Evento - Concierto", category: "Publicidad Digital" },
  { id: 3, src: basketballMural, alt: "Mural Deportivo - PAS Eagles", category: "Publicidad OOH" },
  { id: 4, src: fisioterapiaCards, alt: "Tarjetas de Presentación - Fisioterapia", category: "Branding" },
  // Puedes agregar más proyectos aquí
];

export function Marketing360Projects() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % marketing360Projects.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + marketing360Projects.length) % marketing360Projects.length);
    }
  };

  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-tl from-slate-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header con botón de regreso */}
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm tracking-wider uppercase font-semibold">
              {language === 'es' ? 'Volver al inicio' : 'Back to home'}
            </span>
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-base tracking-widest uppercase text-neutral-500">06</span>
            <div className="h-px flex-1 bg-neutral-800"></div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {language === 'es' ? 'Diseño 360°' : '360° Design'}
          </h1>
          <p className="text-base text-neutral-300 max-w-3xl">
            {language === 'es'
              ? 'Estrategias integrales de diseño visual para todos los canales'
              : 'Comprehensive visual design strategies for all channels'}
          </p>
        </div>

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

        {/* Lightbox con imagen escalada apropiadamente */}
        {selectedImage !== null && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-8 md:p-12 lg:p-16"
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
                src={marketing360Projects[selectedImage].src}
                alt={marketing360Projects[selectedImage].alt}
                className="max-w-full max-h-[calc(100vh-140px)] w-auto h-auto object-contain rounded-[3px]"
              />
              <div className="text-center mt-6">
                <p className="text-neutral-100 text-lg">{marketing360Projects[selectedImage].alt}</p>
                <p className="text-neutral-100/60 text-sm mt-2">
                  {selectedImage + 1} / {marketing360Projects.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}