import { Mail, Phone, Linkedin, Instagram, GraduationCap, Code, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const socialLinks = [
  { name: "LinkedIn", icon: Linkedin, url: "https://www.linkedin.com/in/asenat-cordero-obando-productdesigner/" },
  { name: "Instagram", icon: Instagram, url: "https://www.instagram.com/ase_coroba/" },
];

const educationES = [
  "The Hero Camp – Diseño de producto digital (2023)",
  "Universidad Creativa de Costa Rica – Licenciatura en diseño gráfico (2007 – 2009)"
];

const educationEN = [
  "The Hero Camp – Digital Product Design (2023)",
  "Universidad Creativa de Costa Rica – Bachelor's Degree in Graphic Design (2007 – 2009)"
];

const tools = [
  "Adobe Illustrator",
  "Adobe Photoshop",
  "Adobe InDesign",
  "Lightroom",
  "Figma",
  "PowerPoint",
  "Excel",
  "Word"
];

const languages = [
  "Español – Nativo",
  "Inglés – B2 (Profesional)",
  "Catalán – A2"
];

export function AboutContact() {
  const { language } = useLanguage();
  const education = language === 'es' ? educationES : educationEN;
  const languagesList = language === 'es' ? languages : languages;

  return (
    <footer id="about" className="bg-neutral-900 text-white">
      {/* About Section - Formación, Herramientas, Idiomas */}
      <div className="py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Education - Full Width */}
          <div className="mb-24">
            <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-violet-600" />
                <h3 className="text-base tracking-wider uppercase text-white">
                  {language === 'es' ? 'Formación' : 'Education'}
                </h3>
              </div>
            </div>
            <ul className="space-y-3 pl-6 border-l-2 border-neutral-700">
              {education.map((edu, index) => (
                <li key={index} className="text-base text-neutral-400 leading-relaxed">
                  {edu}
                </li>
              ))}
            </ul>
          </div>

          {/* Tools and Languages - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
            {/* Tools */}
            <div>
              <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-violet-600" />
                  <h3 className="text-base tracking-wider uppercase text-white">
                    {language === 'es' ? 'Herramientas' : 'Tools'}
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-base rounded-[3px] border border-neutral-700 hover:border-violet-600 transition-colors"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-violet-600" />
                  <h3 className="text-base tracking-wider uppercase text-white">
                    {language === 'es' ? 'Idiomas' : 'Languages'}
                  </h3>
                </div>
              </div>
              <ul className="space-y-3">
                {languagesList.map((lang, index) => (
                  <li key={index} className="text-base text-neutral-400 leading-relaxed">
                    {lang}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section - Light Background */}
      <div id="contact" className="bg-neutral-100 py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* CTA Box */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl tracking-tight mb-6 text-neutral-900">
              {language === 'es' ? 'Gracias por tu tiempo.' : 'Thank you for your time.'}
            </h2>
            <p className="text-neutral-900 leading-relaxed text-base">
              {language === 'es' 
                ? 'Quedo disponible para ampliar información o comentar cómo puedo contribuir al equipo.'
                : 'I am available to provide more information or discuss how I can contribute to the team.'}
            </p>
          </div>

          {/* Contact Info & Social */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 flex-wrap">
            {/* Contact Info */}
            <a 
              href="mailto:asenath.cordero@gmail.com" 
              className="flex items-center gap-2 text-neutral-900 hover:text-violet-600 transition-colors"
            >
              <Mail className="w-5 h-5 text-violet-600" />
              <span className="text-base">asenath.cordero@gmail.com</span>
            </a>
            <a 
              href="tel:+34658607228" 
              className="flex items-center gap-2 text-neutral-900 hover:text-violet-600 transition-colors"
            >
              <Phone className="w-5 h-5 text-violet-600" />
              <span className="text-base">658 607 228</span>
            </a>

            {/* Social Links */}
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[3px] border border-neutral-300 hover:border-violet-600 hover:bg-violet-50 transition-all duration-300 text-base text-neutral-900"
              >
                <social.icon className="w-5 h-5" />
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - White Background */}
      <div className="bg-white py-8 px-6 md:px-12 lg:px-24 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-900">
            <p className="uppercase">
              © 2026 Ase-CorOba. {language === 'es' ? 'Todos los derechos reservados' : 'All rights reserved'}.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-violet-600 transition-colors uppercase">
                {language === 'es' ? 'Privacidad' : 'Privacy'}
              </a>
              <a href="#" className="hover:text-violet-600 transition-colors uppercase">
                {language === 'es' ? 'Términos' : 'Terms'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}