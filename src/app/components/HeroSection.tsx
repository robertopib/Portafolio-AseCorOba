import { ArrowDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import home from "../../../content/home.json";

export function HeroSection() {
  const { language } = useLanguage();

  const scrollToWork = () => {
    const workSection = document.querySelector('#work');
    workSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    const contactSection = document.querySelector('#contact');
    contactSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24 pt-20 pb-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${home.hero.backgroundImage})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/75" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full">
        <div className="space-y-8">
          <div className="space-y-2">
            {/* Main Title */}
            <h1 className="text-left text-xl md:text-3xl lg:text-4xl font-bold text-neutral-900">
              {home.hero.title[language]}
            </h1>

            {/* Subtitle */}
            <p className="text-left text-base md:text-lg lg:text-xl font-bold text-neutral-900">
              {home.hero.subtitle[language]}
            </p>
          </div>

          <div className="max-w-3xl">
            <p className="text-base text-neutral-900 leading-relaxed text-justify">
              {home.hero.body[language]}
            </p>
          </div>

          {/* Botones CTA */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={scrollToWork}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-[3px] transition-all duration-300 group flex items-center gap-2"
            >
              <span>{home.hero.cta1[language]}</span>
              <ArrowDown className="w-5 h-5 transition-transform group-hover:translate-y-1" />
            </button>
            <button
              onClick={scrollToContact}
              className="px-8 py-4 bg-white border-2 border-neutral-300 hover:border-violet-600 text-neutral-900 rounded-[3px] transition-all duration-300"
            >
              {home.hero.cta2[language]}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}