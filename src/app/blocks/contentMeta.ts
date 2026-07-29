/**
 * Front-end readers for the per-field meta (show/hide + editable caption) that
 * the CMS emits as FLAT sibling keys in the content JSON:
 *   - `<name>Visible`: boolean (absent/true = shown, false = hidden)
 *   - `<name>Label`:   localized `{ es, en }` caption
 *
 * Defaults are "shown" and "fall back to the hardcoded string", so a content
 * object without any meta renders exactly as before (pixel-identical).
 *
 * Usage in a renderer (bind the group + language once, then read by field name):
 *   const vis = fieldVisibleFor(content);
 *   const lbl = fieldLabelFor(content, language);
 *   {vis('title') && <h3>{content.title?.[language]}</h3>}
 *   <span>{lbl('sectionNumber', '02')}</span>
 */

type Lang = 'es' | 'en'
type LocalizedText = { es?: string | null; en?: string | null }

/** True unless `<name>Visible` is explicitly false (default-visible). */
export function fieldVisible(group: unknown, name: string): boolean {
  const v = (group as Record<string, unknown> | null | undefined)?.[`${name}Visible`]
  return v !== false
}

/** The editable `<name>Label` caption for `language`, or `fallback` if unset. */
export function fieldLabel(
  group: unknown,
  name: string,
  language: Lang,
  fallback: string,
): string {
  const l = (group as Record<string, unknown> | null | undefined)?.[`${name}Label`] as
    | LocalizedText
    | undefined
  return l?.[language] ?? fallback
}

/** Curried helper: `const vis = fieldVisibleFor(content); vis('title')`. */
export const fieldVisibleFor = (group: unknown) => (name: string) =>
  fieldVisible(group, name)

/** Curried helper: `const lbl = fieldLabelFor(content, language); lbl('k', 'fb')`. */
export const fieldLabelFor =
  (group: unknown, language: Lang) => (name: string, fallback: string) =>
    fieldLabel(group, name, language, fallback)
