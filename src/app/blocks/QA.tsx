import { useLanguage } from "../context/LanguageContext";
import type { QABlockProps } from "./types";

/**
 * QA block — a question/answer list. Each item may have a scalar answer and/or
 * a bulleted answer (mirrors CaseStudy sketches.qa / learnings.qa).
 */
export function QA(props: QABlockProps) {
  const { language } = useLanguage();
  const items = props.items ?? [];

  return (
    <section className="py-12 px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-3xl mx-auto">
        {props.title?.[language] && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {props.title[language]}
          </h2>
        )}
        <div className="space-y-8">
          {items.map((item, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                {item.question?.[language]}
              </h3>
              {item.answer?.[language] && (
                <p className="text-base text-neutral-300 leading-relaxed">
                  {item.answer[language]}
                </p>
              )}
              {item.bullets && item.bullets.length > 0 && (
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  {item.bullets.map((b, i) => (
                    <li key={i} className="text-base text-neutral-300 leading-relaxed">
                      {b.text?.[language]}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
