import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import uxui from "../../../content/sections/uxui.json";

export function UXUIProduct() {
  const { language, t } = useLanguage();

  return (
    <section className="py-16 px-6 md:px-12 lg:px-24 bg-black relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-neutral-500">04</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
          {uxui.home.heading[language]}
        </h3>
        <p className="text-xl md:text-2xl text-pink-300 mb-6 italic font-semibold">
          {uxui.home.tagline[language]}
        </p>
        <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
          {uxui.home.description[language]}
        </p>
        <div className="mb-12 max-w-2xl">
          <p className="text-base text-neutral-100 mb-2">
            <strong>{t('home.studioLabel')}</strong> {uxui.home.studioName}
          </p>
          <p className="text-sm text-pink-300 font-semibold mb-1 uppercase tracking-wide">
            {t('home.roleLabel')}
          </p>
          <p className="text-base text-neutral-400">
            {uxui.home.roleDescription[language]}
          </p>
        </div>

        {/* Imagen horizontal única */}
        <div className="mb-12">
          <div className="group relative rounded-[3px] overflow-hidden bg-gradient-to-br from-pink-300/15 via-rose-300/10 to-purple-400/10 p-[2px] hover:shadow-2xl hover:shadow-xl transition-all duration-500">
            <div className="relative overflow-hidden bg-black rounded-[3px]" style={{ height: '300px' }}>
              <ImageWithFallback
                src={uxui.home.sketchImage}
                alt={uxui.home.sketchAlt[language]}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-transparent to-rose-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </div>

        {/* Ver más proyectos Button */}
        <div className="flex justify-center mt-12">
          <Link
            to="/proyectos/uxui-producto"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-300 to-rose-300 hover:from-fuchsia-500 hover:to-orange-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
          >
            <span>{uxui.home.cta[language]}</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
