import { useLanguage } from "../context/LanguageContext";
import type { SectionHeadingBlockProps } from "./types";

/**
 * SectionHeading block — the numbered section divider used above each portfolio
 * section on the home page (copied from the `02 ——— / heading` markup shared by
 * CorporateBranding, WebAppDesign, etc.). `number` is the eyebrow index; the
 * localized `heading` is optional.
 */
export function SectionHeading(props: SectionHeadingBlockProps) {
  const { language } = useLanguage();

  return (
    <section className="px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 pt-16">
          <span className="text-base tracking-widest uppercase text-neutral-500">
            {props.number}
          </span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        {props.eyebrow?.[language] && (
          <p className="text-sm tracking-widest uppercase text-neutral-500 mt-6">
            {props.eyebrow[language]}
          </p>
        )}

        {props.heading?.[language] && (
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-100 mt-6 uppercase">
            {props.heading[language]}
          </h2>
        )}
      </div>
    </section>
  );
}
