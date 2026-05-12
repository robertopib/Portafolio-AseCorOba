import { Briefcase } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useLanguage } from "../context/LanguageContext";

const experienceES = [
  {
    role: "Fundadora | Click & Print",
    period: "2023 – 2025",
    responsibilities: [
      "Desarrollo integral de identidad de marca y sistema visual 360°",
      "Diseño de packaging, mockups y preparación de artes finales para imprenta",
      "Creación de materiales promocionales offline y online",
      "Fotografía de producto y dirección de arte para sesiones de foto y video",
      "Desarrollo de estrategias de branding y conceptualización visual de proyectos",
      "Diseño de newsletters y contenido para RRSS",
      "Coordinación con proveedores y supervisión de producción gráfica"
    ]
  },
  {
    role: "Diseñadora de producto / diseñadora gráfica | Barbas.Studio",
    period: "2015 – 2023",
    responsibilities: [
      "Desarrollo de materiales gráficos para campañas de marketing y comunicación",
      "Diseño de identidad visual y adaptación a múltiples canales",
      "Creación de presentaciones comerciales en PowerPoint",
      "Motion graphics para piezas digitales",
      "Dirección de arte en proyectos visuales y colaboración en shootings",
      "Retoque fotográfico avanzado y optimización de imágenes para impresión y digital",
      "Coordinación con stakeholders y equipos multidisciplinares"
    ]
  },
  {
    role: "IDSca – Diseñadora UX/UI – Web",
    period: "2012 – 2015",
    responsibilities: [
      "Diseño visual de interfaces digitales y adaptación gráfica a entornos online",
      "Optimización de arquitectura visual y experiencia de usuario",
      "Trabajo colaborativo con equipos técnicos en desarrollo de productos digitales"
    ]
  },
  {
    role: "Arweb – Diseñadora gráfica y web",
    period: "2009 – 2012",
    responsibilities: [
      "Diseño de materiales gráficos corporativos y piezas promocionales",
      "Desarrollo y mantenimiento de sitios web",
      "Creación y adaptación de recursos visuales para distintos formatos digitales e impresos"
    ]
  }
];

const experienceEN = [
  {
    role: "Founder | Click & Print",
    period: "2023 – 2025",
    responsibilities: [
      "Comprehensive development of brand identity and 360° visual system",
      "Packaging design, mockups and preparation of final artwork for printing",
      "Creation of offline and online promotional materials",
      "Product photography and art direction for photo and video sessions",
      "Development of branding strategies and visual conceptualization of projects",
      "Design of newsletters and social media content",
      "Coordination with suppliers and supervision of graphic production"
    ]
  },
  {
    role: "Product Designer / Graphic Designer | Barbas.Studio",
    period: "2015 – 2023",
    responsibilities: [
      "Development of graphic materials for marketing and communication campaigns",
      "Visual identity design and adaptation to multiple channels",
      "Creation of commercial presentations in PowerPoint",
      "Motion graphics for digital pieces",
      "Art direction in visual projects and collaboration in shootings",
      "Advanced photo retouching and image optimization for print and digital",
      "Coordination with stakeholders and multidisciplinary teams"
    ]
  },
  {
    role: "IDSca – UX/UI Designer – Web",
    period: "2012 – 2015",
    responsibilities: [
      "Visual design of digital interfaces and graphic adaptation to online environments",
      "Optimization of visual architecture and user experience",
      "Collaborative work with technical teams in digital product development"
    ]
  },
  {
    role: "Arweb – Graphic and Web Designer",
    period: "2009 – 2012",
    responsibilities: [
      "Design of corporate graphic materials and promotional pieces",
      "Development and maintenance of websites",
      "Creation and adaptation of visual resources for different digital and print formats"
    ]
  }
];

export function AboutSection() {
  const { language } = useLanguage();
  const experience = language === 'es' ? experienceES : experienceEN;

  return (
    <section className="bg-neutral-900 text-white py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <span className="text-base tracking-widest uppercase text-white">01</span>
          <div className="h-px flex-1 bg-neutral-700"></div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight mb-6">
            {language === 'es' ? 'Trayectoria' : 'Career Path'}
          </h2>
        </div>

        {/* Experience Accordion */}
        <div>
          <div className="bg-neutral-800 p-6 rounded-[3px] mb-8">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-violet-600" />
              <h3 className="text-base tracking-wider uppercase text-white">
                {language === 'es' ? 'Experiencia profesional' : 'Professional Experience'}
              </h3>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-6">
            {experience.map((job, index) => (
              <AccordionItem key={index} value={`exp-${index}`} className="border-l-2 border-neutral-700 hover:border-violet-600 transition-colors pl-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex-1">
                    <h4 className="text-base text-white mb-1">{job.role}</h4>
                    <p className="text-base text-violet-500 tracking-wider">{job.period}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 mt-4">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="text-base text-neutral-400 leading-relaxed flex gap-2">
                        <span className="text-violet-500 mt-1.5">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
