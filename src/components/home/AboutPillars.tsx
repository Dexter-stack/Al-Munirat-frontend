import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";

export function AboutPillars() {
  const { t } = useTranslation();

  const PILLARS = [
    {
      icon: "auto_stories",
      label: t("home.aboutPillars.pillar1Label"),
      title: t("home.aboutPillars.pillar1Title"),
      desc: t("home.aboutPillars.pillar1Desc"),
    },
    {
      icon: "translate",
      label: t("home.aboutPillars.pillar2Label"),
      title: t("home.aboutPillars.pillar2Title"),
      desc: t("home.aboutPillars.pillar2Desc"),
    },
    {
      icon: "balance",
      label: t("home.aboutPillars.pillar3Label"),
      title: t("home.aboutPillars.pillar3Title"),
      desc: t("home.aboutPillars.pillar3Desc"),
    },
    {
      icon: "favorite",
      label: t("home.aboutPillars.pillar4Label"),
      title: t("home.aboutPillars.pillar4Title"),
      desc: t("home.aboutPillars.pillar4Desc"),
    },
  ];

  const QUALITY_POINTS = [
    { icon: "diversity_3", title: t("home.aboutPillars.quality1Title"), desc: t("home.aboutPillars.quality1Desc") },
    { icon: "verified", title: t("home.aboutPillars.quality2Title"), desc: t("home.aboutPillars.quality2Desc") },
    { icon: "devices", title: t("home.aboutPillars.quality3Title"), desc: t("home.aboutPillars.quality3Desc") },
  ];

  return (
    <section className="bg-slate-50/50 py-20 lg:py-28" id="about">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
            {t("home.aboutPillars.eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("home.aboutPillars.title")}
          </h2>
          <p dir="rtl" className="mt-2 font-arabic text-lg text-slate-600">
            أكاديمية المنيرة: العلم والعبادة والعمل
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {t("home.aboutPillars.descriptionPrefix")} <em>{t("home.aboutPillars.descriptionEmphasis")}</em>
            {t("home.aboutPillars.descriptionSuffix")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="group flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <MaterialIcon name={pillar.icon} className="text-2xl" />
                </div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand-600">
                  {pillar.label}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{pillar.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {QUALITY_POINTS.map((point) => (
            <div key={point.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                <MaterialIcon name={point.icon} className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{point.title}</h4>
                <p className="mt-1 text-xs text-slate-500">{point.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
