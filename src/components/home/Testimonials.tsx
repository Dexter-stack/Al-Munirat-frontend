import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";

export function Testimonials() {
  const { t } = useTranslation();

  const TESTIMONIALS = [
    {
      quote: t("home.testimonials.quote1"),
      name: "Fatima & Zayd Qureshi",
      role: t("home.testimonials.role1"),
      initials: "FZ",
    },
    {
      quote: t("home.testimonials.quote2"),
      name: "Dr. Sofia Hussain",
      role: t("home.testimonials.role2"),
      initials: "SH",
    },
    {
      quote: t("home.testimonials.quote3"),
      name: "Ibrahim Al-Sayed",
      role: t("home.testimonials.role3"),
      initials: "IA",
    },
  ];

  return (
    <section className="bg-slate-50/60 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
            {t("home.testimonials.eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("home.testimonials.title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((tItem) => (
            <div key={tItem.name} className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-8">
              <div>
                <div className="mb-4 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcon key={i} name="star" filled className="text-sm" />
                  ))}
                </div>
                <p className="text-xs italic leading-relaxed text-slate-700 sm:text-sm">"{tItem.quote}"</p>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  {tItem.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{tItem.name}</div>
                  <div className="text-[11px] text-slate-500">{tItem.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
