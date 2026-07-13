import { Briefcase } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { useLanguage } from "../context/LanguageContext";
import type { ExperienceAccordionBlockProps } from "./types";

/**
 * ExperienceAccordion block — the career/experience accordion, copied verbatim
 * from components/AboutSection.tsx (role / period trigger + responsibilities
 * bullets), reusing the shared shadcn Accordion.
 */
export function ExperienceAccordion(props: ExperienceAccordionBlockProps) {
  const { language } = useLanguage();
  const experience = props.experience ?? [];

  return (
    <section className="bg-neutral-900 text-white py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-white">01</span>
          <div className="h-px flex-1 bg-neutral-700"></div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight mb-6">
            {props.headings?.careerPath?.[language]}
          </h2>
        </div>

        {/* Experience Accordion */}
        <div>
          <div className="bg-neutral-800 p-6 rounded-[3px] mb-8">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-violet-600" />
              <h3 className="text-base tracking-wider uppercase text-white">
                {props.headings?.professionalExperience?.[language]}
              </h3>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-6">
            {experience.map((job, index) => (
              <AccordionItem
                key={index}
                value={`exp-${index}`}
                className="border-l-2 border-neutral-700 hover:border-violet-600 transition-colors pl-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex-1">
                    <h4 className="text-base text-white mb-1">{job.role?.[language]}</h4>
                    <p className="text-base text-violet-500 tracking-wider">{job.period?.[language]}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 mt-4">
                    {(job.responsibilities ?? []).map((resp, idx) => (
                      <li
                        key={idx}
                        className="text-base text-neutral-400 leading-relaxed flex gap-2"
                      >
                        <span className="text-violet-500 mt-1.5">•</span>
                        <span>{resp.item?.[language]}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
