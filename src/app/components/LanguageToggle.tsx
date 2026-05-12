import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 text-xs tracking-wider uppercase text-neutral-900 hover:text-violet-600 transition-colors"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'es' ? 'EN' : 'ES'}</span>
    </button>
  );
}