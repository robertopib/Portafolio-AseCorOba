import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Importar las imágenes existentes
import crackers from "figma:asset/0331bcc7cb0ecb8bd115a7c0cf30c0a8ff135f20.png";
import croissant from "figma:asset/2d1ee71b9db3d47cf9b08fb26a0fcc51b694724b.png";
import breadDargent from "figma:asset/018f2b6c0c838991be0fd695b9a40d96c17a99cb.png";
import croissantPackaging from "figma:asset/95b1f1901a9a927a55eb85ba8046e64a5a1c45cb.png";
import giftBox1 from "figma:asset/499ed072f4775e6510a42bfef3ec1b4947d31bd9.png";
import giftBoxVinte from "figma:asset/7049f97e2491edd848fa3c28b66e0294e0cf12a8.png";

// Nuevas imágenes de producto
import giftBoxVinte1 from "figma:asset/447691c1d376a057765b58c44c66dccffa8d8a2d.png";
import giftBoxVinte2 from "figma:asset/8d57df26d4e90777a83fabf9677891fdc9f1521c.png";
import giftBoxVinte3 from "figma:asset/7f79ef935ac214cfdb3e4ce14f5f634e1d0b58cb.png";
import giftBoxVinte4 from "figma:asset/7f991d3c54a3581ede5cf4f87a668e5f34041005.png";
import giftBoxVinte5 from "figma:asset/ae37db016eb028ff2e031bafffe94dcb4980543d.png";
import giftBoxVinte6 from "figma:asset/02d666e36750db1697f016e1932e0bdcde6ada9f.png";

const productProjects = [
  { id: 1, src: crackers, alt: "Crackers D'Argent - Fotografía de Producto", category: "Fotografía de Producto" },
  { id: 2, src: croissant, alt: "Croissant Artesanal - Fotografía de Producto", category: "Fotografía de Producto" },
  { id: 3, src: breadDargent, alt: "Pan D'Argent - Fotografía de Producto", category: "Fotografía de Producto" },
  { id: 4, src: croissantPackaging, alt: "Croissant Premium - Packaging & Fotografía", category: "Packaging" },
  { id: 5, src: giftBox1, alt: "Caja de Regalo Navideña - Packaging & Fotografía", category: "Packaging" },
  { id: 6, src: giftBoxVinte1, alt: "Set Regalo Vinte-Vinte - Vista 1", category: "Packaging" },
  { id: 7, src: giftBoxVinte2, alt: "Set Regalo Vinte-Vinte - Vista 2", category: "Packaging" },
  { id: 8, src: giftBoxVinte3, alt: "Set Regalo Vinte-Vinte - Vista 3", category: "Packaging" },
  { id: 9, src: giftBoxVinte, alt: "Set Regalo Vinte-Vinte - Vista 4", category: "Packaging" },
  { id: 10, src: giftBoxVinte4, alt: "Set Regalo Vinte-Vinte - Vista 5", category: "Packaging" },
  { id: 11, src: giftBoxVinte5, alt: "Set Regalo Vinte-Vinte - Vista 6", category: "Packaging" },
  { id: 12, src: giftBoxVinte6, alt: "Set Regalo Vinte-Vinte - Vista 7", category: "Packaging" },
];

export function ProductPhotographyProjects() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % productProjects.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + productProjects.length) % productProjects.length);
    }
  };

  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-rose-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-tl from-purple-400/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header con botón de regreso */}
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-rose-300 hover:text-orange-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm tracking-wider uppercase font-semibold">
              {language === 'es' ? 'Volver al inicio' : 'Back to home'}
            </span>
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-base tracking-widest uppercase text-neutral-500">05</span>
            <div className="h-px flex-1 bg-neutral-800"></div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {language === 'es' ? 'Fotografía de Producto y Packaging' : 'Product Photography & Packaging'}
          </h1>
          <p className="text-base text-neutral-300 max-w-3xl">
            {language === 'es'
              ? 'Dirección de arte y fotografía que resalta la esencia de cada producto'
              : 'Art direction and photography that highlights the essence of each product'}
          </p>
        </div>

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
                src={productProjects[selectedImage].src}
                alt={productProjects[selectedImage].alt}
                className="max-w-full max-h-[calc(100vh-140px)] w-auto h-auto object-contain rounded-[3px]"
              />
              <div className="text-center mt-6">
                <p className="text-neutral-100 text-lg">{productProjects[selectedImage].alt}</p>
                <p className="text-neutral-100/60 text-sm mt-2">
                  {selectedImage + 1} / {productProjects.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
