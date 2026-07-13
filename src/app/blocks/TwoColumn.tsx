import { useLanguage } from "../context/LanguageContext";
import type { TwoColumnBlockProps } from "./types";

/**
 * TwoColumn block — two side-by-side labelled text columns (mirrors the
 * problem/solution layout of a case study).
 */
export function TwoColumn(props: TwoColumnBlockProps) {
  const { language } = useLanguage();

  return (
    <section className="py-12 px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div>
          {props.left?.label?.[language] && (
            <p className="text-sm tracking-widest uppercase text-purple-300 font-semibold mb-3">
              {props.left.label[language]}
            </p>
          )}
          <p className="text-base text-neutral-300 leading-relaxed">
            {props.left?.text?.[language]}
          </p>
        </div>
        <div>
          {props.right?.label?.[language] && (
            <p className="text-sm tracking-widest uppercase text-purple-300 font-semibold mb-3">
              {props.right.label[language]}
            </p>
          )}
          <p className="text-base text-neutral-300 leading-relaxed">
            {props.right?.text?.[language]}
          </p>
        </div>
      </div>
    </section>
  );
}
