import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";

/** 404 page shown when a URL does not match any page slug. */
export function NotFound() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm tracking-widest uppercase text-purple-300 font-semibold mb-4">404</p>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 uppercase mb-6">
        {language === "es" ? "Página no encontrada" : "Page not found"}
      </h1>
      <p className="text-base text-neutral-400 max-w-md mb-10">
        {language === "es"
          ? "La página que buscas no existe o fue movida."
          : "The page you are looking for doesn't exist or was moved."}
      </p>
      <Link
        to="/"
        className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-[3px] transition-all duration-300"
      >
        {language === "es" ? "Volver al inicio" : "Back to home"}
      </Link>
    </div>
  );
}
