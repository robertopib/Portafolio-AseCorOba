import type { SpacerBlockProps } from "./types";

/**
 * Spacer block — vertical spacing between blocks. Language-agnostic.
 * `bg-black` keeps the dark page background continuous between sections.
 */
const sizeClass: Record<SpacerBlockProps["size"], string> = {
  small: "h-6",
  medium: "h-12",
  large: "h-24",
  xlarge: "h-40",
};

export function Spacer(props: SpacerBlockProps) {
  return <div className={`bg-black ${sizeClass[props.size] ?? sizeClass.medium}`} aria-hidden="true" />;
}
