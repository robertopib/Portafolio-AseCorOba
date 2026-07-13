import pagesData from "../../../content/pages.json";
import navigationData from "../../../content/navigation.json";
import type { PageData, NavItem, Localized } from "./types";

/**
 * Build-time data access for the page-builder front-end. `content/pages.json`
 * and `content/navigation.json` are the fixtures the future fetch script will
 * emit from Payload; these helpers read them and resolve pages by slug / URL.
 */

const pages = (pagesData.pages ?? []) as unknown as PageData[];

/** Normalize a URL pathname to a page slug. '/' => 'home'; strips edge slashes. */
export function pathToSlug(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  return trimmed === "" ? "home" : trimmed;
}

/**
 * Look up a page by URL pathname. The home page is matched by either the ''
 * (empty) or 'home' slug so both conventions work.
 */
export function getPageByPath(pathname: string): PageData | undefined {
  const slug = pathToSlug(pathname);
  return pages.find((p) => {
    const pSlug = p.slug === "" ? "home" : p.slug;
    return pSlug === slug;
  });
}

export function getAllPages(): PageData[] {
  return pages;
}

/** Navigation brand + menu items from content/navigation.json. */
export const navBrand = navigationData.brand as unknown as Localized;
export const navItems = (navigationData.items ?? []) as unknown as NavItem[];
