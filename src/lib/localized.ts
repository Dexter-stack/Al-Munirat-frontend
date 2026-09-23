/**
 * The backend sends both English and Arabic variants for most public
 * content fields (title/arabic_title, description/arabic_description, …).
 * This picks the right one for the active i18n locale, falling back to
 * English when no Arabic variant is present — mirroring the inline pattern
 * already used by ProgramsSection.tsx / Home.tsx, factored out for reuse
 * across the catalog/detail pages.
 */
export interface LocalizedText {
  text: string;
  isArabic: boolean;
}

export function pickLocalized(
  en: string,
  ar: string | undefined | null,
  lang: string,
): LocalizedText {
  if (lang.startsWith("ar") && ar) {
    return { text: ar, isArabic: true };
  }
  return { text: en, isArabic: false };
}
