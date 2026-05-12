import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  es: {
    // Header/Nav
    'nav.home': 'Inicio',
    'nav.back': 'Volver al inicio',
    
    // Hero Section
    'hero.greeting': 'Hola, soy',
    'hero.title': 'Visual Designer & Brand Specialist',
    'hero.description': 'Creo identidades visuales memorables y experiencias digitales que conectan marcas con audiencias',
    'hero.cta': 'Ver mi trabajo',
    'hero.contact': 'Contactar',
    
    // Portfolio Sections
    'portfolio.branding': 'Branding Corporativo',
    'portfolio.branding.desc': 'Identidades visuales coherentes y memorables que conectan con tu audiencia',
    'portfolio.web': 'Diseño Web & Apps',
    'portfolio.web.desc': 'Experiencias digitales intuitivas y atractivas para usuarios modernos',
    'portfolio.photography': 'Fotografía de Producto y Packaging',
    'portfolio.photography.desc': 'Dirección de arte y fotografía que resalta la esencia de cada producto',
    'portfolio.marketing': 'Diseño 360°',
    'portfolio.marketing.desc': 'Estrategias visuales completas desde social media hasta publicidad exterior',
    'portfolio.viewMore': 'Ver más proyectos',
    
    // Branding Page
    'branding.title': 'Branding Corporativo',
    'branding.subtitle.sports': 'Deportes & Fitness',
    'branding.subtitle.beauty': 'Belleza & Estética',
    'branding.subtitle.logos': 'Logos',
    
    // Categories
    'category.branding': 'Branding Digital',
    'category.campaign': 'Campaña Publicitaria',
    'category.brandDesign': 'Diseño de Marca',
    'category.socialMedia': 'Social Media',
    'category.educational': 'Contenido Educativo',
    'category.fitness': 'Evento Fitness',
    'category.online': 'Evento Online',
    'category.logo': 'Logo',
    'category.packaging': 'Packaging',
    'category.product': 'Fotografía de Producto',
    'category.webDesign': 'Diseño Web',
    'category.appDesign': 'Diseño de App',
    'category.uiux': 'UI/UX Design',
    'category.design360': 'Diseño 360°',
    'category.ooh': 'Publicidad OOH',
    
    // Projects - Sports/Fitness
    'project.wodfest1': 'WodFest Costa Rica - Campaña publicitaria',
    'project.wodfest2': 'WodFest Costa Rica - Diseño de marca',
    'project.fitnessDeadlift': 'OFF DAY Trainer - Técnica Deadlift',
    'project.fitnessPullups': 'OFF DAY Trainer - Técnica Pull-ups',
    'project.snagaRelay': 'SNAGA Team Relay 9th Anniversary',
    
    // Projects - Beauty
    'project.adrianaMunoz': 'Adriana Muñoz - Contenido para redes sociales',
    'project.phicontour': 'Live Técnica Phicontour - Adriana Muñoz',
    'project.phibrowsCourse': 'Curso Phibrows - Material Promocional',
    'project.phibrowsBefore': 'Curso Phibrows - Antes y Después',
    'project.liveMicroblading': 'Live con Ana Oprea - Técnica Microblading',
    'project.liveShading': 'Live con Stefany Galeano - Phibrows Shading',
    'project.anaGrace': 'Ana Grace Salon & Estética - Branding digital',
    'project.anaGraceHair': 'Ana Grace - Promoción Tratamiento Capilar',
    'project.anaGraceOnline': 'Ana Grace - Compra Online',
    'project.anaGracePayment': 'Ana Grace - Información de Pago',
    
    // Projects - Logos
    'project.dulcereta': 'La Dulcereta Obleas - Diseño de Logo',
    'project.fitCookie': 'Fit Cookie by Elsa Cubero - Diseño de Logo',
    'project.nomads': 'Nomads Eighty-Six - Diseño de Logo',
    'project.laPredrena': 'Carnicería La Pedreña - Diseño de Logo',
    'project.falecon': 'Falecon Decoraciones - Diseño de Logo',
    
    // Projects - Product Photography
    'project.crackers': "Crackers D'Argent - Fotografía de Producto",
    'project.croissant': 'Croissant Artesanal - Fotografía de Producto',
    'project.bread': "Pan D'Argent - Fotografía de Producto",
    'project.croissantPackaging': 'Croissant Premium - Packaging & Fotografía',
    'project.giftBox': 'Caja de Regalo Navideña - Packaging & Fotografía',
    'project.vinteVinte': 'Set Regalo Vinte-Vinte - Vista',
    
    // About Section
    'about.title': 'Sobre Mí',
    'about.text': 'Visual Designer & Brand Specialist con más de 5 años de experiencia creando identidades visuales coherentes y estrategias de diseño 360° que conectan marcas con sus audiencias.',
    'about.contact': 'Contacto',
    
    // Footer
    'footer.rights': 'Todos los derechos reservados',
    'footer.designed': 'Diseñado y desarrollado con',
    
    // Image counter
    'lightbox.counter': 'de',
  },
  en: {
    // Header/Nav
    'nav.home': 'Home',
    'nav.back': 'Back to home',
    
    // Hero Section
    'hero.greeting': "Hi, I'm",
    'hero.title': 'Visual Designer & Brand Specialist',
    'hero.description': 'I create memorable visual identities and digital experiences that connect brands with audiences',
    'hero.cta': 'View my work',
    'hero.contact': 'Contact',
    
    // Portfolio Sections
    'portfolio.branding': 'Corporate Branding',
    'portfolio.branding.desc': 'Coherent and memorable visual identities that connect with your audience',
    'portfolio.web': 'Web & App Design',
    'portfolio.web.desc': 'Intuitive and attractive digital experiences for modern users',
    'portfolio.photography': 'Product Photography & Packaging',
    'portfolio.photography.desc': 'Art direction and photography that highlights the essence of each product',
    'portfolio.marketing': '360° Design',
    'portfolio.marketing.desc': 'Complete visual strategies from social media to outdoor advertising',
    'portfolio.viewMore': 'View more projects',
    
    // Branding Page
    'branding.title': 'Corporate Branding',
    'branding.subtitle.sports': 'Sports & Fitness',
    'branding.subtitle.beauty': 'Beauty & Aesthetics',
    'branding.subtitle.logos': 'Logos',
    
    // Categories
    'category.branding': 'Digital Branding',
    'category.campaign': 'Advertising Campaign',
    'category.brandDesign': 'Brand Design',
    'category.socialMedia': 'Social Media',
    'category.educational': 'Educational Content',
    'category.fitness': 'Fitness Event',
    'category.online': 'Online Event',
    'category.logo': 'Logo',
    'category.packaging': 'Packaging',
    'category.product': 'Product Photography',
    'category.webDesign': 'Web Design',
    'category.appDesign': 'App Design',
    'category.uiux': 'UI/UX Design',
    'category.design360': '360° Design',
    'category.ooh': 'OOH Advertising',
    
    // Projects - Sports/Fitness
    'project.wodfest1': 'WodFest Costa Rica - Advertising Campaign',
    'project.wodfest2': 'WodFest Costa Rica - Brand Design',
    'project.fitnessDeadlift': 'OFF DAY Trainer - Deadlift Technique',
    'project.fitnessPullups': 'OFF DAY Trainer - Pull-ups Technique',
    'project.snagaRelay': 'SNAGA Team Relay 9th Anniversary',
    
    // Projects - Beauty
    'project.adrianaMunoz': 'Adriana Muñoz - Social Media Content',
    'project.phicontour': 'Live Phicontour Technique - Adriana Muñoz',
    'project.phibrowsCourse': 'Phibrows Course - Promotional Material',
    'project.phibrowsBefore': 'Phibrows Course - Before and After',
    'project.liveMicroblading': 'Live with Ana Oprea - Microblading Technique',
    'project.liveShading': 'Live with Stefany Galeano - Phibrows Shading',
    'project.anaGrace': 'Ana Grace Salon & Aesthetics - Digital Branding',
    'project.anaGraceHair': 'Ana Grace - Hair Treatment Promotion',
    'project.anaGraceOnline': 'Ana Grace - Online Shopping',
    'project.anaGracePayment': 'Ana Grace - Payment Information',
    
    // Projects - Logos
    'project.dulcereta': 'La Dulcereta Obleas - Logo Design',
    'project.fitCookie': 'Fit Cookie by Elsa Cubero - Logo Design',
    'project.nomads': 'Nomads Eighty-Six - Logo Design',
    'project.laPredrena': 'La Pedreña Butcher Shop - Logo Design',
    'project.falecon': 'Falecon Decorations - Logo Design',
    
    // Projects - Product Photography
    'project.crackers': "D'Argent Crackers - Product Photography",
    'project.croissant': 'Artisan Croissant - Product Photography',
    'project.bread': "D'Argent Bread - Product Photography",
    'project.croissantPackaging': 'Premium Croissant - Packaging & Photography',
    'project.giftBox': 'Christmas Gift Box - Packaging & Photography',
    'project.vinteVinte': 'Vinte-Vinte Gift Set - View',
    
    // About Section
    'about.title': 'About Me',
    'about.text': 'Visual Designer & Brand Specialist with over 5 years of experience creating coherent visual identities and 360° design strategies that connect brands with their audiences.',
    'about.contact': 'Contact',
    
    // Footer
    'footer.rights': 'All rights reserved',
    'footer.designed': 'Designed and developed with',
    
    // Image counter
    'lightbox.counter': 'of',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['es']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
