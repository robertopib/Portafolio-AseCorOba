import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Importar las imágenes existentes
import wodfest1 from "figma:asset/25e9467c4a5ed8a5438a741b2b6c73115fc4554c.png";
import wodfest2 from "figma:asset/a8198d99a2383d3dc8005422e6c483014ec215fe.png";
import adrianaMunoz from "figma:asset/334fe9a7bb579717d2294738e06927cda7ba71a4.png";
import anaGrace from "figma:asset/d705e68558f43f7321e71ebf82bad319ce1c7b72.png";

// Nuevas imágenes
import phicontourLive from "figma:asset/924ad8cc50b1d2cc4562e881da584a8099b8ca98.png";
import anaGraceHair from "figma:asset/8e1fdaaa60ef73c2d936187bbd5aeadde19c9452.png";
import anaGraceOnline from "figma:asset/55e51786f46dbf8d1280df1ee1f2191b9f8c5da1.png";
import phibrowsCourse from "figma:asset/61aebc44de89fc59129fc24f781098cc2ebd70ce.png";
import fitnessDeadlift from "figma:asset/88cf5aac8e94d4becb93d3b24d6e943d0a189931.png";
import fitnessPullups from "figma:asset/eca57c4fcb41f2da0eda93130941acd192e257ae.png";
import phibrowsBeforeAfter from "figma:asset/c1204bdbfeefd699b75d0ea1dbec84f6da20a935.png";
import anaGracePayment from "figma:asset/bc36c9234b465fd0ed6e541eac26253ad2aa52df.png";
import liveMicroblading from "figma:asset/3856ecdfcb52b909e8f214c65f073bd1b2de4f84.png";
import livePhibrowsShading from "figma:asset/b009bfec53131ea367511acf598545f131e873aa.png";
import snagaRelay from "figma:asset/b1c180497fe9c391756224aaf833491497eb695f.png";

// Logos
import laDulcereta from "figma:asset/8083d12e7a676eb9b6c1bef623e4ebaf921955b8.png";
import fitCookie from "figma:asset/18ad2feac1b520b631082da80d1b66696f2552e6.png";
import nomads from "figma:asset/0ad42528d7f8e6294084c527d4199685070316d5.png";
import laPedrena from "figma:asset/ef09c6d26327eeac752f4e66090243daccb967ac.png";
import falecon from "figma:asset/98eac7c8344e7766f5b561451c912181822195c1.png";

// Proyectos de Deportes/Fitness
const sportsProjects = [
  { id: 1, src: wodfest1, alt: "WodFest Costa Rica - Campaña publicitaria", category: "Campaña Publicitaria" },
  { id: 2, src: wodfest2, alt: "WodFest Costa Rica - Diseño de marca", category: "Diseño de Marca" },
  { id: 10, src: fitnessDeadlift, alt: "OFF DAY Trainer - Técnica Deadlift", category: "Contenido Educativo" },
  { id: 11, src: fitnessPullups, alt: "OFF DAY Trainer - Técnica Pull-ups", category: "Contenido Educativo" },
  { id: 16, src: snagaRelay, alt: "SNAGA Team Relay 9th Anniversary", category: "Evento Fitness" },
];

// Proyectos de Belleza - Adriana Muñoz
const adrianaMunozProjects = [
  { id: 3, src: adrianaMunoz, alt: "Adriana Muñoz - Contenido para redes sociales", category: "Social Media" },
  { id: 6, src: phicontourLive, alt: "Live Técnica Phicontour - Adriana Muñoz", category: "Social Media" },
  { id: 9, src: phibrowsCourse, alt: "Curso Phibrows - Material Promocional", category: "Social Media" },
  { id: 12, src: phibrowsBeforeAfter, alt: "Curso Phibrows - Antes y Después", category: "Social Media" },
  { id: 14, src: liveMicroblading, alt: "Live con Ana Oprea - Técnica Microblading", category: "Evento Online" },
  { id: 15, src: livePhibrowsShading, alt: "Live con Stefany Galeano - Phibrows Shading", category: "Evento Online" },
];

// Proyectos de Belleza - Ana Grace
const anaGraceProjects = [
  { id: 5, src: anaGrace, alt: "Ana Grace Salon & Estética - Branding digital", category: "Branding Digital" },
  { id: 7, src: anaGraceHair, alt: "Ana Grace - Promoción Tratamiento Capilar", category: "Social Media" },
  { id: 8, src: anaGraceOnline, alt: "Ana Grace - Compra Online", category: "Social Media" },
  { id: 13, src: anaGracePayment, alt: "Ana Grace - Información de Pago", category: "Social Media" },
];

// Logos
const logoProjects = [
  { id: 17, src: laDulcereta, alt: "La Dulcereta Obleas - Diseño de Logo", category: "Logo" },
  { id: 18, src: fitCookie, alt: "Fit Cookie by Elsa Cubero - Diseño de Logo", category: "Logo" },
  { id: 19, src: nomads, alt: "Nomads Eighty-Six - Diseño de Logo", category: "Logo" },
  { id: 20, src: laPedrena, alt: "Carnicería La Pedreña - Diseño de Logo", category: "Logo" },
  { id: 21, src: falecon, alt: "Falecon Decoraciones - Diseño de Logo", category: "Logo" },
];

const allProjects = [...sportsProjects, ...adrianaMunozProjects, ...anaGraceProjects, ...logoProjects];

export function BrandingProjects() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % allProjects.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + allProjects.length) % allProjects.length);
    }
  };

  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

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
            <span className="text-base tracking-widest uppercase text-neutral-500">02</span>
            <div className="h-px flex-1 bg-neutral-800"></div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {language === 'es' ? 'Branding Corporativo' : 'Corporate Branding'}
          </h1>
          <p className="text-base text-neutral-300 max-w-3xl">
            {language === 'es'
              ? 'Identidades visuales coherentes y memorables que conectan con tu audiencia'
              : 'Coherent and memorable visual identities that connect with your audience'}
          </p>
        </div>

        {/* Sección Deportes/Fitness */}
        <div className="mb-16">
          <h2 className="text-xl tracking-wider uppercase text-purple-300 mb-8 font-bold">
            {language === 'es' ? 'Deportes & Fitness' : 'Sports & Fitness'}
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
        </div>

        {/* Sección Belleza/Estética */}
        <div>
          <h2 className="text-xl tracking-wider uppercase text-pink-300 mb-8 font-bold">
            {language === 'es' ? 'Belleza & Estética' : 'Beauty & Aesthetics'}
          </h2>

          {/* Masonry Grid Combinado */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-12">
            {/* Wide Hero */}
            <div
              className="col-span-4 md:col-span-5 row-span-2 group cursor-pointer"
              onClick={() => openLightbox(sportsProjects.length + 0)}
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
              onClick={() => openLightbox(sportsProjects.length + 1)}
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
                onClick={() => openLightbox(sportsProjects.length + adrianaMunozProjects.length + index)}
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
                onClick={() => openLightbox(sportsProjects.length + 2 + index)}
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
        </div>

        {/* Sección Logos */}
        <div className="mt-16">
          <h2 className="text-xl tracking-wider uppercase text-slate-300 mb-8 font-bold">Logos</h2>
          <div className="grid grid-cols-4 md:grid-cols-10 gap-4">
            {logoProjects.map((project, index) => (
              <div
                key={project.id}
                className={index === 0 ? "col-span-4 md:col-span-4 row-span-2" : "col-span-2"}
                onClick={() => openLightbox(sportsProjects.length + adrianaMunozProjects.length + anaGraceProjects.length + index)}
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
        </div>

        {/* Lightbox - Imagen completa y proporcional */}
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
                src={allProjects[selectedImage].src}
                alt={allProjects[selectedImage].alt}
                className="max-w-full max-h-[calc(100vh-140px)] w-auto h-auto object-contain rounded-[3px]"
              />
              <div className="text-center mt-6">
                <p className="text-neutral-100 text-lg">{allProjects[selectedImage].alt}</p>
                <p className="text-neutral-100/60 text-sm mt-2">
                  {selectedImage + 1} / {allProjects.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}