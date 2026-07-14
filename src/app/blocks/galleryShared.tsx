import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Lightbox } from "../components/Lightbox";

/**
 * Shared helpers for the simple single-gallery project pages (web-apps,
 * fotografia, marketing). The card/grid markup lives inline in each block so it
 * stays VERBATIM to the original page component; only the lightbox plumbing
 * (state + overlay) is shared, since it is identical across those pages.
 */

export type GalleryImage = { id: number; src: string; alt: string; category: string };

export function useGalleryLightbox(images: GalleryImage[]) {
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

export function GalleryLightbox({
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
