import { useLanguage } from "../context/LanguageContext";
import type { JourneyMapBlockProps } from "./types";

/**
 * JourneyMap block — a user-journey table: intro paragraphs, a stage-by-stage
 * grid (action / thought / friction rows), and an optional Q&A section
 * (mirrors CaseStudy.journey).
 */
export function JourneyMap(props: JourneyMapBlockProps) {
  const { language } = useLanguage();
  const intro = props.intro ?? [];
  const stages = props.stages ?? [];
  const qa = props.qa ?? [];

  return (
    <section className="py-12 px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-6xl mx-auto">
        {props.title?.[language] && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {props.title[language]}
          </h2>
        )}

        {intro.length > 0 && (
          <div className="space-y-4 mb-10 max-w-3xl">
            {intro.map((p, index) => (
              <p key={index} className="text-base text-neutral-300 leading-relaxed">
                {p.text?.[language]}
              </p>
            ))}
          </div>
        )}

        {/* Stages grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, index) => (
            <div
              key={index}
              className="bg-neutral-900 border border-neutral-800 rounded-[3px] p-6"
            >
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-sm text-neutral-500">{stage.number}</span>
                <h3 className="text-lg font-semibold text-neutral-100">{stage.name?.[language]}</h3>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs tracking-widest uppercase text-purple-300 font-semibold">
                    {props.labels?.action?.[language]}
                  </dt>
                  <dd className="text-sm text-neutral-300">{stage.action?.[language]}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-widest uppercase text-purple-300 font-semibold">
                    {props.labels?.thought?.[language]}
                  </dt>
                  <dd className="text-sm text-neutral-300">{stage.thought?.[language]}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-widest uppercase text-purple-300 font-semibold">
                    {props.labels?.friction?.[language]}
                  </dt>
                  <dd className="text-sm text-neutral-300">{stage.friction?.[language]}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {/* Q&A */}
        {qa.length > 0 && (
          <div className="space-y-6 mt-10 max-w-3xl">
            {qa.map((item, index) => (
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
        )}
      </div>
    </section>
  );
}
