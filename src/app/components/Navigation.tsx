import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

export function Navigation() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { language } = useLanguage();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (isHome) {
      e.preventDefault();
      const element = document.querySelector(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-20">
          <div className="flex flex-col gap-1">
            <Link to="/" className="text-xl md:text-2xl tracking-tight text-neutral-900 uppercase hover:text-violet-600 transition-colors">
              Asenat Cordero Obando
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {isHome ? (
              <a
                href="#work"
                onClick={(e) => handleScrollTo(e, "#work")}
                className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
              >
                {language === 'es' ? 'Proyectos' : 'Projects'}
              </a>
            ) : (
              <Link
                to="/#work"
                className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
              >
                {language === 'es' ? 'Proyectos' : 'Projects'}
              </Link>
            )}
            <div className="h-6 w-px bg-neutral-300"></div>
            {isHome ? (
              <a
                href="#about"
                onClick={(e) => handleScrollTo(e, "#about")}
                className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
              >
                {language === 'es' ? 'Sobre Mí' : 'About Me'}
              </a>
            ) : (
              <Link
                to="/#about"
                className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
              >
                {language === 'es' ? 'Sobre Mí' : 'About Me'}
              </Link>
            )}
            <div className="h-6 w-px bg-neutral-300"></div>
            {isHome ? (
              <a
                href="#contact"
                onClick={(e) => handleScrollTo(e, "#contact")}
                className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
              >
                {language === 'es' ? 'Contacto' : 'Contact'}
              </a>
            ) : (
              <Link
                to="/#contact"
                className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
              >
                {language === 'es' ? 'Contacto' : 'Contact'}
              </Link>
            )}
            <div className="h-6 w-px bg-neutral-300"></div>
            <LanguageToggle />
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 hover:bg-neutral-100 rounded-[3px] transition-colors">
            <Menu className="w-6 h-6 text-neutral-900" />
          </button>
        </div>
      </div>
    </nav>
  );
}
