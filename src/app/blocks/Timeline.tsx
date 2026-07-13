import { useLanguage } from "../context/LanguageContext";
import type { TimelineBlockProps } from "./types";

/**
 * Timeline block — a title, an overall duration, and a list of phases each with
 * its own duration (mirrors CaseStudy.timeline).
 */
export function Timeline(props: TimelineBlockProps) {
  const { language } = useLanguage();
  const phases = props.phases ?? [];

  return (
    <section className="py-12 px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-3xl mx-auto">
        {props.title?.[language] && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {props.title[language]}
          </h2>
        )}
        {(props.durationLabel?.[language] || props.durationValue?.[language]) && (
          <p className="text-base text-neutral-300 mb-8">
            <span className="text-purple-300 font-semibold uppercase tracking-wide">
              {props.durationLabel?.[language]}
            </span>{" "}
            {props.durationValue?.[language]}
          </p>
        )}
        <ol className="space-y-4">
          {phases.map((phase, index) => (
            <li
              key={index}
              className="flex items-center justify-between border-l-2 border-neutral-700 pl-6 py-2"
            >
              <span className="text-base text-neutral-100">{phase.phase?.[language]}</span>
              <span className="text-sm text-neutral-400">{phase.duration?.[language]}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
