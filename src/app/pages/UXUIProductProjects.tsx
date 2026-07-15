import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useLanguage } from "../context/LanguageContext";
import caseStudy from "../../../content/sections/uxui-casestudy.json";

export function UXUIProductProjects() {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-pink-300 hover:text-fuchsia-300 transition-colors mb-8 group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-semibold">{t('nav.back')}</span>
          </Link>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {caseStudy.header.title[language]}
          </h1>
          <p className="text-xl md:text-2xl text-pink-300 mb-6 italic font-semibold">
            {caseStudy.header.tagline[language]}
          </p>
        </div>

        {/* Snaga Project - Hero Image */}
        <div className="mb-16">
          <div className="relative bg-neutral-800 rounded-[3px] overflow-hidden shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-100 to-neutral-100" style={{ height: '400px' }}>
              <ImageWithFallback
                src={caseStudy.hero.image}
                alt={caseStudy.hero.alt[language]}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Project Title */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-4xl tracking-tight text-neutral-100 mb-4">
            {caseStudy.project.name[language]}
          </h2>
          <p className="text-lg md:text-xl text-pink-300 mb-8">
            {caseStudy.project.subtitle[language]}
          </p>

          {/* Project Overview - New Content */}
          <div className="space-y-4">
            {caseStudy.project.overview.map((item, index) => (
              <p key={index} className="text-base text-neutral-100">
                <strong>{item.label[language]}</strong> {item.text[language]}
              </p>
            ))}
          </div>
        </div>

        {/* Introducción */}
        <section className="mb-16">
          {caseStudy.intro.map((paragraph, index) => (
            <p key={index} className="text-base text-neutral-100 leading-relaxed mb-6">
              {paragraph[language]}
            </p>
          ))}
        </section>

        {/* Problema y Solución */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problema */}
            <div>
              <div className="mb-6">
                <div className="inline-block px-4 py-2 bg-pink-900/20 text-pink-300 rounded-[3px] text-sm tracking-widest uppercase mb-4">
                  {caseStudy.problemSolution.problem.label[language]}
                </div>
              </div>
              <p className="text-base text-neutral-100 leading-relaxed">
                {caseStudy.problemSolution.problem.text[language]}
              </p>
            </div>

            {/* Solución */}
            <div>
              <div className="mb-6">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-pink-300 to-rose-300 hover:from-fuchsia-500 hover:to-orange-500 text-neutral-100 rounded-[3px] text-sm tracking-widest uppercase mb-4">
                  {caseStudy.problemSolution.solution.label[language]}
                </div>
              </div>
              <p className="text-base text-neutral-100 leading-relaxed">
                {caseStudy.problemSolution.solution.text[language]}
              </p>
            </div>
          </div>
        </section>

        {/* Detalles del Proyecto */}
        <section className="mb-16">
          <div className="bg-neutral-900 rounded-[3px] overflow-hidden border border-neutral-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-8 py-4 text-base text-pink-300 font-semibold bg-neutral-900/50">
                    {caseStudy.details.headers.tools[language]}
                  </th>
                  <th className="text-left px-8 py-4 text-base text-pink-300 font-semibold bg-neutral-900/50">
                    {caseStudy.details.headers.team[language]}
                  </th>
                  <th className="text-left px-8 py-4 text-base text-pink-300 font-semibold bg-neutral-900/50">
                    {caseStudy.details.headers.role[language]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {caseStudy.details.rows.map((row, index) => (
                  <tr key={index} className={index < caseStudy.details.rows.length - 1 ? "border-b border-neutral-800" : undefined}>
                    <td className="px-8 py-4 text-base text-neutral-100 align-top">{row.tools[language]}</td>
                    <td className="px-8 py-4 text-base text-neutral-100 align-top">{row.team[language]}</td>
                    <td className="px-8 py-4 text-base text-neutral-100 align-top">{row.role[language]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            {caseStudy.timeline.title[language]}
          </h3>
          <div className="bg-neutral-900 rounded-[3px] p-8">
            <p className="text-base text-pink-300 mb-6">
              <strong>{caseStudy.timeline.durationLabel[language]}</strong> {caseStudy.timeline.durationValue[language]}
            </p>
            <div className="space-y-4">
              {caseStudy.timeline.phases.map((phase, index) => (
                <div key={index} className="flex gap-4">
                  <span className="text-base text-neutral-100 min-w-[200px]">{phase.phase[language]}</span>
                  <span className="text-base text-neutral-400">{phase.duration[language]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* User Journey Map */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            {caseStudy.journey.title[language]}
          </h3>
          <p className="text-base text-neutral-100 leading-relaxed mb-8">
            {caseStudy.journey.intro[0][language]}
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-8">
            {caseStudy.journey.intro[1][language]}
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-12">
            {caseStudy.journey.intro[2][language]}
          </p>

          {/* Visual Journey Map */}
          <div className="mb-12">
            <div className="relative">
              {/* Journey Timeline */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                {/* Stage 1: Discovery */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-400/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        {caseStudy.journey.stages[0].number}
                      </div>
                      <h4 className="text-base text-purple-300 font-semibold uppercase tracking-wide mb-4">
                        {caseStudy.journey.stages[0].name[language]}
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.action[language]}</p>
                        <p className="text-sm text-neutral-100">{caseStudy.journey.stages[0].action[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.thought[language]}</p>
                        <p className="text-sm text-neutral-300 italic">{caseStudy.journey.stages[0].thought[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.friction[language]}</p>
                        <p className="text-sm text-rose-300">{caseStudy.journey.stages[0].friction[language]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Exploration */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-pink-300/08 to-pink-600/20 border border-pink-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-pink-200 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        {caseStudy.journey.stages[1].number}
                      </div>
                      <h4 className="text-base text-pink-300 font-semibold uppercase tracking-wide mb-4">
                        {caseStudy.journey.stages[1].name[language]}
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.action[language]}</p>
                        <p className="text-sm text-neutral-100">{caseStudy.journey.stages[1].action[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.thought[language]}</p>
                        <p className="text-sm text-neutral-300 italic">{caseStudy.journey.stages[1].thought[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.friction[language]}</p>
                        <p className="text-sm text-rose-300">{caseStudy.journey.stages[1].friction[language]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 3: Evaluation */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-pink-600/20 to-orange-600/20 border border-pink-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        {caseStudy.journey.stages[2].number}
                      </div>
                      <h4 className="text-base text-pink-300 font-semibold uppercase tracking-wide mb-4">
                        {caseStudy.journey.stages[2].name[language]}
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.action[language]}</p>
                        <p className="text-sm text-neutral-100">{caseStudy.journey.stages[2].action[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.thought[language]}</p>
                        <p className="text-sm text-neutral-300 italic">{caseStudy.journey.stages[2].thought[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.friction[language]}</p>
                        <p className="text-sm text-rose-300">{caseStudy.journey.stages[2].friction[language]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 4: Decision */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-rose-300/08 to-amber-600/20 border border-rose-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-amber-300 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        {caseStudy.journey.stages[3].number}
                      </div>
                      <h4 className="text-base text-rose-300 font-semibold uppercase tracking-wide mb-4">
                        {caseStudy.journey.stages[3].name[language]}
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.action[language]}</p>
                        <p className="text-sm text-neutral-100">{caseStudy.journey.stages[3].action[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.thought[language]}</p>
                        <p className="text-sm text-neutral-300 italic">{caseStudy.journey.stages[3].thought[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.friction[language]}</p>
                        <p className="text-sm text-rose-300">{caseStudy.journey.stages[3].friction[language]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 5: Contact */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-amber-600/20 to-green-600/20 border border-amber-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-green-400 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        {caseStudy.journey.stages[4].number}
                      </div>
                      <h4 className="text-base text-amber-300 font-semibold uppercase tracking-wide mb-4">
                        {caseStudy.journey.stages[4].name[language]}
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.action[language]}</p>
                        <p className="text-sm text-neutral-100">{caseStudy.journey.stages[4].action[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.thought[language]}</p>
                        <p className="text-sm text-neutral-300 italic">{caseStudy.journey.stages[4].thought[language]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">{caseStudy.journey.labels.friction[language]}</p>
                        <p className="text-sm text-rose-300">{caseStudy.journey.stages[4].friction[language]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 via-pink-600 via-orange-600 to-amber-600 opacity-30" style={{ top: '24px' }}></div>
            </div>
          </div>

          {/* Questions & Answers */}
          <div className="space-y-8">
            {caseStudy.journey.qa.map((item, index) => (
              <div key={index}>
                <h4 className="text-base text-pink-300 mb-3">
                  {item.question[language]}
                </h4>
                {item.bullets ? (
                  <ul className="space-y-2 list-disc list-inside text-base text-neutral-100 leading-relaxed">
                    {item.bullets.map((bullet, bIndex) => (
                      <li key={bIndex}>{bullet[language]}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-neutral-100 leading-relaxed">
                    {item.answer[language]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* User Personas */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            {caseStudy.personas.title[language]}
          </h3>
          <p className="text-base text-neutral-100 leading-relaxed mb-8">
            {caseStudy.personas.intro[0][language]}
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-12">
            {caseStudy.personas.intro[1][language]}
          </p>

          {/* Preguntas sobre User Personas */}
          <div className="space-y-6 mb-12">
            {caseStudy.personas.qa.map((item, index) => (
              <div key={index}>
                <h4 className="text-base text-pink-300 mb-3">
                  {item.question[language]}
                </h4>
                {item.answer.map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    className={pIndex < item.answer.length - 1 ? "text-base text-neutral-100 leading-relaxed mb-4" : "text-base text-neutral-100 leading-relaxed"}
                  >
                    {paragraph[language]}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* Persona Cards */}
          <div className="space-y-8">
            {caseStudy.personas.cards.map((persona, index) => (
              <div key={index} className="bg-neutral-900 rounded-[3px] p-8">
                <div className="mb-6">
                  <h4 className="text-lg text-neutral-100 mb-2">{persona.name[language]}</h4>
                  <p className="text-base text-neutral-400 mb-2">{persona.descriptor[language]}</p>
                  <p className="text-base text-pink-300 italic">{persona.quote[language]}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h5 className="text-base text-neutral-100 mb-3">{caseStudy.personas.sectionLabels.basicInfo[language]}</h5>
                    <ul className="space-y-1 text-base text-neutral-400">
                      {persona.basicInfo.map((entry, eIndex) => (
                        <li key={eIndex}>• {entry[language]}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-base text-neutral-100 mb-3">{caseStudy.personas.sectionLabels.channels[language]}</h5>
                    <ul className="space-y-1 text-base text-neutral-400">
                      {persona.channels.map((entry, eIndex) => (
                        <li key={eIndex}>• {entry[language]}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-base text-neutral-100 mb-3">{caseStudy.personas.sectionLabels.motivations[language]}</h5>
                    <ul className="space-y-1 text-base text-neutral-400">
                      {persona.motivations.map((entry, eIndex) => (
                        <li key={eIndex}>• {entry[language]}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-base text-neutral-100 mb-3">{caseStudy.personas.sectionLabels.painPoints[language]}</h5>
                    <ul className="space-y-1 text-base text-neutral-400">
                      {persona.painPoints.map((entry, eIndex) => (
                        <li key={eIndex}>• {entry[language]}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bocetos */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            {caseStudy.sketches.title[language]}
          </h3>
          <p className="text-base text-neutral-100 leading-relaxed mb-6">
            {caseStudy.sketches.intro[0][language]}
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-6">
            {caseStudy.sketches.intro[1][language]}
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-12">
            {caseStudy.sketches.intro[2][language]}
          </p>

          <div className="space-y-6">
            {caseStudy.sketches.qa.map((item, index) => (
              <div key={index}>
                <h4 className="text-base text-pink-300 mb-3">
                  {item.question[language]}
                </h4>
                <p className="text-base text-neutral-100 leading-relaxed">
                  {item.answer[language]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Aprendizajes */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            {caseStudy.learnings.title[language]}
          </h3>

          <div className="space-y-8">
            {caseStudy.learnings.qa.map((item, index) => (
              <div key={index}>
                <h4 className="text-base text-pink-300 mb-3">
                  {item.question[language]}
                </h4>
                {item.answer.map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    className={pIndex < item.answer.length - 1 ? "text-base text-neutral-100 leading-relaxed mb-4" : "text-base text-neutral-100 leading-relaxed"}
                  >
                    {paragraph[language]}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Back to Home Button */}
        <div className="flex justify-center mt-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-300 to-rose-300 hover:from-fuchsia-500 hover:to-orange-500 hover:bg-violet-700 text-neutral-100 rounded-[3px] transition-all duration-300 group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>{t('nav.back')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
