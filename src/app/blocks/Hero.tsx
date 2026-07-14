import { ArrowDown } from "lucide-react";
import { useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import type { HeroBlockProps } from "./types";

/**
 * Hero block renderer — JSX/classNames copied verbatim from
 * components/HeroSection.tsx, with hardcoded/JSON values parameterized from
 * block props.
 */
export function Hero(props: HeroBlockProps) {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to the first anchored section on the page if one exists (blocks with
  // an `anchorId` are wrapped in a container carrying that html id). If no
  // anchored section is present, fall back to the next section below the hero.
  const scrollToWork = () => {
    // The hero itself may be wrapped in an anchor container; look past it for
    // the first *other* element carrying an id.
    const anchors = Array.from(document.querySelectorAll<HTMLElement>('main [id]'));
    const heroTop = sectionRef.current?.getBoundingClientRect().top ?? 0;
    const firstBelow = anchors.find(
      (el) => el.getBoundingClientRect().top > heroTop + 1,
    );
    if (firstBelow) {
      firstBelow.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const next = sectionRef.current?.nextElementSibling;
    if (next) next.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  const scrollToContact = () => {
    const contactSection = document.querySelector('#contact');
    if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24 pt-20 pb-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${props.backgroundImagePath ?? ''})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/75" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full">
        <div className="space-y-8">
          <div className="space-y-2">
            {/* Main Title */}
            <h1 className="text-left text-xl md:text-3xl lg:text-4xl font-bold text-neutral-900">
              {props.title?.[language]}
            </h1>

            {/* Subtitle */}
            <p className="text-left text-base md:text-lg lg:text-xl font-bold text-neutral-900">
              {props.subtitle?.[language]}
            </p>
          </div>

          <div className="max-w-3xl">
            <p className="text-base text-neutral-900 leading-relaxed text-justify">
              {props.body?.[language]}
            </p>
          </div>

          {/* Botones CTA */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={scrollToWork}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-[3px] transition-all duration-300 group flex items-center gap-2"
            >
              <span>{props.cta1?.[language]}</span>
              <ArrowDown className="w-5 h-5 transition-transform group-hover:translate-y-1" />
            </button>
            <button
              onClick={scrollToContact}
              className="px-8 py-4 bg-white border-2 border-neutral-300 hover:border-violet-600 text-neutral-900 rounded-[3px] transition-all duration-300"
            >
              {props.cta2?.[language]}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
