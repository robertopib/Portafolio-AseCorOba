import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";

// Importar las imágenes de Figma
import crackers from "figma:asset/0331bcc7cb0ecb8bd115a7c0cf30c0a8ff135f20.png";
import croissant from "figma:asset/2d1ee71b9db3d47cf9b08fb26a0fcc51b694724b.png";
import breadDargent from "figma:asset/018f2b6c0c838991be0fd695b9a40d96c17a99cb.png";
import croissantPackaging from "figma:asset/95b1f1901a9a927a55eb85ba8046e64a5a1c45cb.png";
import giftBox1 from "figma:asset/499ed072f4775e6510a42bfef3ec1b4947d31bd9.png";
import giftBoxVinte from "figma:asset/7049f97e2491edd848fa3c28b66e0294e0cf12a8.png";

const products = [
  {
    id: 1,
    title: "Crackers D'Argent",
    category: "Fotografía de Producto",
    image: crackers
  },
  {
    id: 2,
    title: "Croissant Artesanal",
    category: "Fotografía de Producto",
    image: croissant
  },
  {
    id: 3,
    title: "Pan D'Argent",
    category: "Fotografía de Producto",
    image: breadDargent
  },
  {
    id: 4,
    title: "Croissant Premium",
    category: "Packaging & Fotografía",
    image: croissantPackaging
  },
  {
    id: 5,
    title: "Caja de Regalo Navideña",
    category: "Packaging & Fotografía",
    image: giftBox1
  },
  {
    id: 6,
    title: "Set Regalo Vinte-Vinte",
    category: "Packaging & Fotografía",
    image: giftBoxVinte
  }
];

export function ProductPhotography() {
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
          {language === 'es' ? 'Fotografía de producto y packaging' : 'Product Photography & Packaging'}
        </h3>
        <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
          {language === 'es' ? 'Fotografía comercial y diseño de empaque' : 'Commercial photography and packaging design'}
        </p>
        <div className="mb-12 max-w-2xl">
          <p className="text-base text-neutral-100 mb-2">
            <strong>{language === 'es' ? 'Branding corporativo de:' : 'Corporate branding for:'}</strong> Click&Print
          </p>
          <p className="text-sm text-rose-300 font-semibold mb-1 uppercase tracking-wide">
            {language === 'es' ? 'Mi rol' : 'My Role'}
          </p>
          <p className="text-base text-neutral-400">
            {language === 'es'
              ? 'Desarrollo visual de producto desde la conceptualización hasta la ejecución: fotografía, diseño de empaque y retoque digital enfocado en comunicación comercial.'
              : 'Visual product development from conceptualization to execution: photography, packaging design and digital retouching focused on commercial communication.'}
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
            <span>{language === 'es' ? 'Ver más fotografías' : 'View more photos'}</span>
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
      )}
    </section>
  );
}