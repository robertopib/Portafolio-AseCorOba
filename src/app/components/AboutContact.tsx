import { Mail, Phone, Linkedin, Instagram, GraduationCap, Code, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { fieldVisible } from "../blocks/contentMeta";
import aboutJson from "../../../content/about.json";

const socialIcons: Record<string, typeof Linkedin> = {
  LinkedIn: Linkedin,
  Instagram: Instagram,
};

type LocalizedText = { es: string; en: string };
type AboutContent = {
  headings: { education: LocalizedText; tools: LocalizedText; languages: LocalizedText };
  education: { es: string[]; en: string[] };
  tools: string[];
  languages: string[];
  contact: { heading: LocalizedText; body: LocalizedText; email: string; phone: string };
  socialLinks: { name: string; url: string }[];
  footer: {
    copyrightPrefix: string;
    rights: LocalizedText;
    privacy: LocalizedText;
    terms: LocalizedText;
  };
};

export function AboutContact({ content }: { content?: AboutContent }) {
  const { language } = useLanguage();
  const about = content ?? aboutJson;

  const socialLinks = about.socialLinks.map((s) => ({
    name: s.name,
    icon: socialIcons[s.name],
    url: s.url,
  }));

  const tools = about.tools;
  const languages = about.languages;

  const education = about.education[language];
  const languagesList = languages;

  return (
    <footer id="about" className="bg-neutral-900 text-white">
      {/* About Section - Formación, Herramientas, Idiomas */}
      <div className="py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Education - Full Width */}
          <div className="mb-24">
            {fieldVisible(about.headings, "education") && (
              <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                  <h3 className="text-base tracking-wider uppercase text-white">
                    {about.headings.education[language]}
                  </h3>
                </div>
              </div>
            )}
            {fieldVisible(about, "education") && (
              <ul className="space-y-3 pl-6 border-l-2 border-neutral-700">
                {education.map((edu, index) => (
                  <li key={index} className="text-base text-neutral-400 leading-relaxed">
                    {edu}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tools and Languages - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
            {/* Tools */}
            <div>
              {fieldVisible(about.headings, "tools") && (
                <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
                  <div className="flex items-center gap-3">
                    <Code className="w-5 h-5 text-violet-600" />
                    <h3 className="text-base tracking-wider uppercase text-white">
                      {about.headings.tools[language]}
                    </h3>
                  </div>
                </div>
              )}
              {fieldVisible(about, "tools") && (
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
              )}
            </div>

            {/* Languages */}
            <div>
              {fieldVisible(about.headings, "languages") && (
                <div className="bg-neutral-800 p-4 rounded-[3px] mb-8">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-violet-600" />
                    <h3 className="text-base tracking-wider uppercase text-white">
                      {about.headings.languages[language]}
                    </h3>
                  </div>
                </div>
              )}
              {fieldVisible(about, "languages") && (
                <ul className="space-y-3">
                  {languagesList.map((lang, index) => (
                    <li key={index} className="text-base text-neutral-400 leading-relaxed">
                      {lang}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section - Light Background */}
      <div id="contact" className="bg-neutral-100 py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* CTA Box */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            {fieldVisible(about.contact, "heading") && (
              <h2 className="text-3xl md:text-4xl tracking-tight mb-6 text-neutral-900">
                {about.contact.heading[language]}
              </h2>
            )}
            {fieldVisible(about.contact, "body") && (
              <p className="text-neutral-900 leading-relaxed text-base">
                {about.contact.body[language]}
              </p>
            )}
          </div>

          {/* Contact Info & Social */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 flex-wrap">
            {/* Contact Info */}
            {fieldVisible(about.contact, "email") && (
              <a
                href="mailto:asenath.cordero@gmail.com"
                className="flex items-center gap-2 text-neutral-900 hover:text-violet-600 transition-colors"
              >
                <Mail className="w-5 h-5 text-violet-600" />
                <span className="text-base">{about.contact.email}</span>
              </a>
            )}
            {fieldVisible(about.contact, "phone") && (
              <a
                href="tel:+34658607228"
                className="flex items-center gap-2 text-neutral-900 hover:text-violet-600 transition-colors"
              >
                <Phone className="w-5 h-5 text-violet-600" />
                <span className="text-base">{about.contact.phone}</span>
              </a>
            )}

            {/* Social Links */}
            {fieldVisible(about, "socialLinks") && socialLinks.map((social) => (
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
            {fieldVisible(about.footer, "rights") && (
              <p className="uppercase">
                {fieldVisible(about.footer, "copyrightPrefix") && `${about.footer.copyrightPrefix} `}
                {about.footer.rights[language]}.
              </p>
            )}
            <div className="flex gap-6">
              {fieldVisible(about.footer, "privacy") && (
                <a href="#" className="hover:text-violet-600 transition-colors uppercase">
                  {about.footer.privacy[language]}
                </a>
              )}
              {fieldVisible(about.footer, "terms") && (
                <a href="#" className="hover:text-violet-600 transition-colors uppercase">
                  {about.footer.terms[language]}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}