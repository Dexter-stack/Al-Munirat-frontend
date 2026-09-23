import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white pb-20 pt-12 lg:pb-28 lg:pt-20">
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-brand-100/40 via-sky-50/30 to-transparent blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col items-start text-start lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="tracking-wide text-slate-700">{t("home.hero.badge")}</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-0.5 font-bold text-brand-600">
                {t("home.hero.badgeHighlight")}
                <MaterialIcon name="chevron_right" className="text-sm" />
              </span>
            </div>

            <h1 className="mb-4 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {t("home.hero.titleLine1")} <br />
              <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-slate-900 bg-clip-text text-transparent">
                {t("home.hero.titleLine2")}
              </span>
            </h1>
            <p dir="rtl" className="mb-5 font-arabic text-xl font-normal leading-relaxed text-slate-600 sm:text-2xl">
              تعلّم، ارتقِ، وعِش دينك بإتقان وبصيرة وسند متصل
            </p>
            <p className="mb-8 max-w-xl text-base font-normal leading-relaxed text-slate-600 sm:text-lg">
              {t("home.hero.description")}
            </p>

            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <Button asChild size="lg" className="h-auto w-full rounded-2xl px-7 py-3.5 text-sm shadow-sm hover:shadow-lg hover:shadow-brand-500/25 sm:w-auto">
                <Link to="/courses">
                  {t("home.hero.ctaExplore")}
                  <MaterialIcon name="east" className="text-base" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-auto w-full rounded-2xl border-slate-200 px-6 py-3.5 text-sm shadow-sm sm:w-auto"
              >
                <Link to="/hajj-umrah">
                  <MaterialIcon name="calendar_month" className="text-lg text-slate-500" />
                  {t("home.hero.ctaUmrah")}
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-100 pt-6 text-xs text-slate-500">
              {[
                { icon: "verified", label: t("home.hero.featureSanad") },
                { icon: "military_tech", label: t("home.hero.featureAccreditation") },
                { icon: "flight", label: t("home.hero.featureLicense") },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <MaterialIcon name={f.icon} className="text-base text-brand-600" />
                  <span className="font-medium text-slate-700">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-2 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-200/50 to-slate-100 blur-sm" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                <div className="flex h-[440px] w-full items-center justify-center bg-gradient-to-br from-brand-50 via-sky-50 to-blue-100">
                  <MaterialIcon name="auto_stories" className="text-8xl text-brand-300" />
                </div>
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/40 bg-white/95 p-4 shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600">
                        <MaterialIcon name="menu_book" className="text-xl" />
                      </div>
                      <div>
                        <div className="text-xs font-bold tracking-tight text-slate-900">{t("home.hero.cardCohortTitle")}</div>
                        <div className="text-[11px] text-slate-500">{t("home.hero.cardCohortMeta")}</div>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      {t("home.hero.cardEnrolling")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 -top-4 flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <MaterialIcon name="workspace_premium" className="text-sm" />
                </div>
                <div className="text-start">
                  <div className="text-xs font-extrabold leading-none text-slate-900">98.4%</div>
                  <div className="mt-0.5 text-[10px] font-medium text-slate-500">{t("home.hero.cardPassRateLabel")}</div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 flex max-w-xs items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white shadow-xl sm:-left-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
                  <MaterialIcon name="school" className="text-lg" />
                </div>
                <div className="text-start">
                  <div className="text-xs font-bold text-white">{t("home.hero.cardStudentsLabel")}</div>
                  <div className="text-[11px] text-slate-400">{t("home.hero.cardLocationLabel")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
