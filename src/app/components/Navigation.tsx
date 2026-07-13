import { Menu } from "lucide-react";
import { Fragment } from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";
import { navBrand, navItems } from "../blocks/pages";

/**
 * Navigation — menu items are now data-driven from content/navigation.json
 * (localized labels + resolved hrefs), instead of hardcoded links. Styling and
 * behaviour are unchanged from the original:
 *   - `anchor` items scroll-jump when already on the home page, and link to
 *     "/<href>" otherwise.
 *   - non-anchor items are plain <Link>s.
 *   - a vertical divider separates each item, and the LanguageToggle stays last.
 */
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
              {navBrand[language]}
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <Fragment key={index}>
                {item.anchor ? (
                  isHome ? (
                    <a
                      href={item.href}
                      onClick={(e) => handleScrollTo(e, item.href)}
                      className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
                    >
                      {item.label[language]}
                    </a>
                  ) : (
                    <Link
                      to={`/${item.href}`}
                      className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
                    >
                      {item.label[language]}
                    </Link>
                  )
                ) : (
                  <Link
                    to={item.href}
                    className="text-xs tracking-wider uppercase hover:text-violet-600 transition-colors px-4 py-2 text-neutral-900"
                  >
                    {item.label[language]}
                  </Link>
                )}
                <div className="h-6 w-px bg-neutral-300"></div>
              </Fragment>
            ))}
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
