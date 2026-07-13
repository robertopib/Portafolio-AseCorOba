import { useLanguage } from "../context/LanguageContext";
import type { DetailsTableBlockProps } from "./types";

/**
 * DetailsTable block — a simple label/value list (mirrors CaseStudy.details:
 * tools / team / role). Values may contain line breaks.
 */
export function DetailsTable(props: DetailsTableBlockProps) {
  const { language } = useLanguage();
  const rows = props.rows ?? [];

  return (
    <section className="py-12 px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-3xl mx-auto">
        {props.title?.[language] && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {props.title[language]}
          </h2>
        )}
        <dl className="divide-y divide-neutral-800 border-t border-b border-neutral-800">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-4">
              <dt className="text-sm tracking-widest uppercase text-purple-300 font-semibold">
                {row.label?.[language]}
              </dt>
              <dd className="md:col-span-2 text-base text-neutral-300 whitespace-pre-line">
                {row.value?.[language]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
