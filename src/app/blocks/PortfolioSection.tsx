import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import type { PortfolioSectionBlockProps } from "./types";

/**
 * PortfolioSection block — the home-page section intro above a project gallery:
 * heading + description + studio name / role + a "view more" CTA. Copied from
 * the intro markup shared by CorporateBranding / WebAppDesign home sections.
 * The "Estudio:" / "Rol:" labels come from ui.json via t() to match originals.
 */
export function PortfolioSection(props: PortfolioSectionBlockProps) {
  const { language, t } = useLanguage();

  return (
    <section className="px-6 md:px-12 lg:px-24 bg-black">
      <div className="max-w-7xl mx-auto">
        {props.heading?.[language] && (
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100 mb-4 uppercase">
            {props.heading[language]}
          </h3>
        )}
        {props.description?.[language] && (
          <p className="text-base text-neutral-300 mt-4 mb-4 max-w-2xl">
            {props.description[language]}
          </p>
        )}

        {/* Studio / Role Info */}
        <div className="mb-12 max-w-2xl">
          {props.studioName && (
            <p className="text-base text-neutral-100 mb-2">
              <strong>{t('home.studioLabel')}</strong> {props.studioName}
            </p>
          )}
          <p className="text-sm text-pink-300 font-semibold mb-1 uppercase tracking-wide">
            {t('home.roleLabel')}
          </p>
          {props.roleDescription?.[language] && (
            <p className="text-base text-neutral-400">
              {props.roleDescription[language]}
            </p>
          )}
        </div>

        {/* Ver más proyectos Button */}
        {props.ctaLabel?.[language] && props.ctaHref && (
          <div className="flex justify-center mt-12">
            <Link
              to={props.ctaHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
            >
              <span>{props.ctaLabel[language]}</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
