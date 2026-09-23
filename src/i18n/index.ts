import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
// Split by area (public/student/admin) so translation work on each can
// proceed independently without every contributor editing the same file —
// each area owns exactly one pair of these. All namespaces are merged into
// a single flat `translation` bundle below; key collisions across files
// are a bug (each area uses its own top-level keys, e.g. "studentDashboard").
import enPublic from "./locales/en.public.json";
import arPublic from "./locales/ar.public.json";
import enStudent from "./locales/en.student.json";
import arStudent from "./locales/ar.student.json";
import enAdmin from "./locales/en.admin.json";
import arAdmin from "./locales/ar.admin.json";

export const RTL_LANGUAGES = ["ar"];

function applyDirection(language: string) {
  const dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...en, ...enPublic, ...enStudent, ...enAdmin } },
      ar: { translation: { ...ar, ...arPublic, ...arStudent, ...arAdmin } },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ar"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "almunirah_language",
    },
  });

applyDirection(i18n.resolvedLanguage ?? i18n.language ?? "en");
i18n.on("languageChanged", applyDirection);

export default i18n;
