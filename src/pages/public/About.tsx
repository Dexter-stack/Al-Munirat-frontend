import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/public/PageHeader";

export default function AboutPage() {
  const { t } = useTranslation();

  const PILLARS = [
    {
      icon: "auto_stories",
      label: t("about.pillar1Label"),
      title: t("about.pillar1Title"),
      desc: t("about.pillar1Desc"),
    },
    {
      icon: "translate",
      label: t("about.pillar2Label"),
      title: t("about.pillar2Title"),
      desc: t("about.pillar2Desc"),
    },
    {
      icon: "balance",
      label: t("about.pillar3Label"),
      title: t("about.pillar3Title"),
      desc: t("about.pillar3Desc"),
    },
    {
      icon: "favorite",
      label: t("about.pillar4Label"),
      title: t("about.pillar4Title"),
      desc: t("about.pillar4Desc"),
    },
  ];

  const LEADERSHIP = [
    {
      icon: "school",
      title: t("about.leadership1Title"),
      desc: t("about.leadership1Desc"),
    },
    {
      icon: "diversity_3",
      title: t("about.leadership2Title"),
      desc: t("about.leadership2Desc"),
    },
    {
      icon: "support_agent",
      title: t("about.leadership3Title"),
      desc: t("about.leadership3Desc"),
    },
  ];

  const ACCREDITATION = [
    { icon: "verified", label: t("about.accreditation1") },
    { icon: "military_tech", label: t("about.accreditation2") },
    { icon: "policy", label: t("about.accreditation3") },
    { icon: "devices", label: t("about.accreditation4") },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        arabicTitle="أكاديمية المنيرة: العلم والعبادة والعمل"
        description={t("about.description")}
      />

      {/* Mission / history */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6">
              <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
                {t("about.sinceLabel")}
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {t("about.historyTitle")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                {t("about.historyPara1")}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                {t("about.historyPara2")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-auto rounded-2xl px-6 py-3.5 text-sm">
                  <Link to="/courses">
                    {t("about.ctaExploreCourses")}
                    <MaterialIcon name="east" className="text-base" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-auto rounded-2xl border-slate-200 px-6 py-3.5 text-sm">
                  <Link to="/register">{t("about.ctaBeginAdmission")}</Link>
                </Button>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-2 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-200/50 to-slate-100 blur-sm" />
                <div className="flex h-[360px] w-full items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-brand-50 via-sky-50 to-blue-100 shadow-2xl">
                  <MaterialIcon name="mosque" className="text-8xl text-brand-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="bg-slate-50/50 py-16 lg:py-24" id="pillars">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("about.pillarsEyebrow")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {t("about.pillarsTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {t("about.pillarsDesc")}
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
        </div>
      </section>

      {/* Leadership / faculty */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("about.leadershipEyebrow")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {t("about.leadershipTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {LEADERSHIP.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <MaterialIcon name={item.icon} className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditation strip */}
      <section className="bg-slate-900 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ACCREDITATION.map((item) => (
              <div key={item.label} className="flex items-start gap-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
                  <MaterialIcon name={item.icon} className="text-lg" />
                </div>
                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t("about.ctaTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {t("about.ctaDescription")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-auto rounded-2xl px-7 py-3.5 text-sm">
              <Link to="/courses">
                {t("about.ctaViewCourses")}
                <MaterialIcon name="arrow_forward" className="text-base" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-auto rounded-2xl border-slate-200 px-6 py-3.5 text-sm">
              <Link to="/contact">{t("about.ctaContactUs")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
