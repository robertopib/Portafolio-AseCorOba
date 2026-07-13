import { Mail, Phone, Linkedin, Instagram } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { ContactBlockProps } from "./types";

/**
 * Contact block — copied from the Contact + Footer portions of
 * components/AboutContact.tsx (the education/tools/languages columns are the
 * separate InfoColumns block). Social icons are matched by name; unknown names
 * render without an icon.
 */
const socialIcons: Record<string, typeof Linkedin> = {
  LinkedIn: Linkedin,
  Instagram: Instagram,
};

export function Contact(props: ContactBlockProps) {
  const { language } = useLanguage();
  const socialLinks = props.socialLinks ?? [];
  const footer = props.footer;

  return (
    <footer className="bg-neutral-900 text-white">
      {/* Contact Section - Light Background */}
      <div id="contact" className="bg-neutral-100 py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* CTA Box */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl tracking-tight mb-6 text-neutral-900">
              {props.heading?.[language]}
            </h2>
            <p className="text-neutral-900 leading-relaxed text-base">
              {props.body?.[language]}
            </p>
          </div>

          {/* Contact Info & Social */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 flex-wrap">
            {/* Contact Info */}
            {props.email && (
              <a
                href={`mailto:${props.email}`}
                className="flex items-center gap-2 text-neutral-900 hover:text-violet-600 transition-colors"
              >
                <Mail className="w-5 h-5 text-violet-600" />
                <span className="text-base">{props.email}</span>
              </a>
            )}
            {props.phone && (
              <a
                href={`tel:${props.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 text-neutral-900 hover:text-violet-600 transition-colors"
              >
                <Phone className="w-5 h-5 text-violet-600" />
                <span className="text-base">{props.phone}</span>
              </a>
            )}

            {/* Social Links */}
            {socialLinks.map((social) => {
              const Icon = social.name ? socialIcons[social.name] : undefined;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[3px] border border-neutral-300 hover:border-violet-600 hover:bg-violet-50 transition-all duration-300 text-base text-neutral-900"
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{social.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer - White Background */}
      {footer && (
        <div className="bg-white py-8 px-6 md:px-12 lg:px-24 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-900">
              <p className="uppercase">
                {footer.copyrightPrefix} {footer.rights?.[language]}.
              </p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-violet-600 transition-colors uppercase">
                  {footer.privacy?.[language]}
                </a>
                <a href="#" className="hover:text-violet-600 transition-colors uppercase">
                  {footer.terms?.[language]}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
