import { useTranslation } from "react-i18next";

export function StatsStrip() {
  const { t } = useTranslation();

  const STATS = [
    { value: t("home.stats.sanadValue"), label: t("home.stats.sanadLabel"), desc: t("home.stats.sanadDesc") },
    { value: t("home.stats.modulesValue"), label: t("home.stats.modulesLabel"), desc: t("home.stats.modulesDesc") },
    { value: t("home.stats.nusukValue"), label: t("home.stats.nusukLabel"), desc: t("home.stats.nusukDesc") },
    { value: t("home.stats.yearsValue"), label: t("home.stats.yearsLabel"), desc: t("home.stats.yearsDesc") },
  ];

  return (
    <section className="border-y border-slate-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-2 gap-8 divide-slate-100 text-center md:grid-cols-4 md:divide-x">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center px-4">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">{stat.value}</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                {stat.label}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">{stat.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
