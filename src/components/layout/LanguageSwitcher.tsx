import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className={cn("flex items-center gap-2 rounded-lg bg-slate-100 p-1", className)}>
      <button
        type="button"
        onClick={() => i18n.changeLanguage("en")}
        aria-pressed={current === "en"}
        className={cn(
          "rounded px-2.5 py-1 text-xs font-semibold transition-all",
          current === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage("ar")}
        aria-pressed={current === "ar"}
        className={cn(
          "rounded px-2.5 py-1 font-arabic text-xs font-semibold transition-all",
          current === "ar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900",
        )}
      >
        العربية
      </button>
    </div>
  );
}
