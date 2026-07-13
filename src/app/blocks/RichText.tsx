import { useLanguage } from "../context/LanguageContext";
import type { RichTextBlockProps } from "./types";

/**
 * RichText block — an optional heading plus a run of localized paragraphs.
 * Mirrors the CaseStudy intro paragraph runs.
 */
export function RichText(props: RichTextBlockProps) {
  const { language } = useLanguage();
  const paragraphs = props.paragraphs ?? [];

  return (
    <section className="py-12 px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-3xl mx-auto">
        {props.heading?.[language] && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {props.heading[language]}
          </h2>
        )}
        <div className="space-y-4">
          {paragraphs.map((p, index) => (
            <p key={index} className="text-base text-neutral-300 leading-relaxed">
              {p.text?.[language]}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
