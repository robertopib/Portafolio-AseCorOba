import { useLanguage } from "../context/LanguageContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import type { ImageBlockProps } from "./types";

/**
 * Image block — a single image with an optional caption and display width.
 * The image ref is pre-resolved to a path by the fetch script.
 */
const widthClass: Record<NonNullable<ImageBlockProps["width"]>, string> = {
  full: "max-w-none",
  contained: "max-w-5xl mx-auto",
  half: "max-w-2xl mx-auto",
};

export function ImageBlock(props: ImageBlockProps) {
  const { language } = useLanguage();
  const wrap = widthClass[props.width ?? "full"];

  return (
    <section className="py-12 px-6 md:px-12 lg:px-24 bg-black">
      <figure className={wrap}>
        <ImageWithFallback
          src={props.image}
          alt={props.caption?.[language] ?? ""}
          className="w-full h-auto rounded-[3px]"
        />
        {props.caption?.[language] && (
          <figcaption className="text-sm text-neutral-400 text-center mt-4">
            {props.caption[language]}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
