import { GraduationCap, Code, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { InfoColumnsBlockProps } from "./types";

/**
 * InfoColumns block — the education (full width) + tools/languages (side by
 * side) section, copied from the "About" portion of components/AboutContact.tsx.
 */
export function InfoColumns(props: InfoColumnsBlockProps) {
  const { language } = useLanguage();
  const education = props.education ?? [];
  const tools = props.tools ?? [];
  const languages = props.languages ?? [];

  return (
    <div id="about" className="bg-neutral-900 text-white">
      <div className="py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Education - Full Width */}
          <div className="mb-24">
            <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-violet-600" />
                <h3 className="text-base tracking-wider uppercase text-white">
                  {props.headings?.education?.[language]}
                </h3>
              </div>
            </div>
            <ul className="space-y-3 pl-6 border-l-2 border-neutral-700">
              {education.map((edu, index) => (
                <li key={index} className="text-base text-neutral-400 leading-relaxed">
                  {edu.item?.[language]}
                </li>
              ))}
            </ul>
          </div>

          {/* Tools and Languages - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
            {/* Tools */}
            <div>
              <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-violet-600" />
                  <h3 className="text-base tracking-wider uppercase text-white">
                    {props.headings?.tools?.[language]}
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-base rounded-[3px] border border-neutral-700 hover:border-violet-600 transition-colors"
                  >
                    {tool.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-violet-600" />
                  <h3 className="text-base tracking-wider uppercase text-white">
                    {props.headings?.languages?.[language]}
                  </h3>
                </div>
              </div>
              <ul className="space-y-3">
                {languages.map((lang, index) => (
                  <li key={index} className="text-base text-neutral-400 leading-relaxed">
                    {lang.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
