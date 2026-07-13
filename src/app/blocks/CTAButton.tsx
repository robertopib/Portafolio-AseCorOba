import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";
import type { CTAButtonBlockProps } from "./types";

/**
 * CTAButton block — a standalone call-to-action link. Styles reuse the button
 * treatments from the originals: 'primary' (violet), 'secondary' (outlined),
 * 'link' (inline gradient "view more" style).
 */
export function CTAButton(props: CTAButtonBlockProps) {
  const { language } = useLanguage();
  const label = props.label?.[language] ?? "";
  const href = props.href ?? "#";
  const style = props.style ?? "primary";

  if (style === "secondary") {
    return (
      <div className="flex justify-center px-6 md:px-12 lg:px-24 py-8">
        <Link
          to={href}
          className="px-8 py-4 bg-white border-2 border-neutral-300 hover:border-violet-600 text-neutral-900 rounded-[3px] transition-all duration-300"
        >
          {label}
        </Link>
      </div>
    );
  }

  if (style === "link") {
    return (
      <div className="flex justify-center px-6 md:px-12 lg:px-24 py-8">
        <Link
          to={href}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-neutral-100 font-bold uppercase tracking-wide rounded-[3px] transition-all duration-300 group hover:shadow-lg hover:shadow-xl"
        >
          <span>{label}</span>
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-6 md:px-12 lg:px-24 py-8">
      <Link
        to={href}
        className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-[3px] transition-all duration-300"
      >
        {label}
      </Link>
    </div>
  );
}
