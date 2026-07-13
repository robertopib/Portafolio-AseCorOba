import { useLanguage } from "../context/LanguageContext";
import type { PersonaCardsBlockProps } from "./types";

/**
 * PersonaCards block — persona cards each with a quote plus basic-info /
 * channels / motivations / pain-point lists, an intro, and an optional Q&A
 * (mirrors CaseStudy.personas).
 */
export function PersonaCards(props: PersonaCardsBlockProps) {
  const { language } = useLanguage();
  const intro = props.intro ?? [];
  const qa = props.qa ?? [];
  const cards = props.cards ?? [];
  const labels = props.sectionLabels;

  const lists = (card: NonNullable<PersonaCardsBlockProps["cards"]>[number]) =>
    [
      { label: labels?.basicInfo?.[language], items: card.basicInfo },
      { label: labels?.channels?.[language], items: card.channels },
      { label: labels?.motivations?.[language], items: card.motivations },
      { label: labels?.painPoints?.[language], items: card.painPoints },
    ] as const;

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

        <div className="grid gap-8 md:grid-cols-2">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-neutral-900 border border-neutral-800 rounded-[3px] p-6"
            >
              <h3 className="text-xl font-bold text-neutral-100 uppercase">{card.name?.[language]}</h3>
              {card.descriptor?.[language] && (
                <p className="text-sm text-purple-300 font-semibold uppercase tracking-wide mt-1">
                  {card.descriptor[language]}
                </p>
              )}
              {card.quote?.[language] && (
                <p className="text-base text-neutral-400 italic mt-4 border-l-2 border-neutral-700 pl-4">
                  {card.quote[language]}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                {lists(card).map((section, si) =>
                  section.items && section.items.length > 0 ? (
                    <div key={si}>
                      <h4 className="text-xs tracking-widest uppercase text-purple-300 font-semibold mb-2">
                        {section.label}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {section.items.map((it, ii) => (
                          <li key={ii} className="text-sm text-neutral-300">
                            {it.text?.[language]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>

        {qa.length > 0 && (
          <div className="space-y-6 mt-10 max-w-3xl">
            {qa.map((item, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-neutral-100 mb-2">
                  {item.question?.[language]}
                </h3>
                <div className="space-y-2">
                  {(item.answer ?? []).map((p, i) => (
                    <p key={i} className="text-base text-neutral-300 leading-relaxed">
                      {p.text?.[language]}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
