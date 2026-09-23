import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";

export function CbtPreview() {
  const { t } = useTranslation();

  const FEATURES = [
    { icon: "spellcheck", title: t("home.cbtPreview.featureVowelTitle"), desc: t("home.cbtPreview.featureVowelDesc") },
    { icon: "timelapse", title: t("home.cbtPreview.featureTimerTitle"), desc: t("home.cbtPreview.featureTimerDesc") },
    { icon: "receipt_long", title: t("home.cbtPreview.featureReceiptTitle"), desc: t("home.cbtPreview.featureReceiptDesc") },
  ];

  const OPTIONS = [
    t("home.cbtPreview.mockOption1"),
    t("home.cbtPreview.mockOption2"),
    t("home.cbtPreview.mockOption3"),
    t("home.cbtPreview.mockOption4"),
  ];

  return (
    <section className="border-b border-slate-100 bg-white py-20 lg:py-28" id="cbt-preview">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("home.cbtPreview.eyebrow")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {t("home.cbtPreview.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {t("home.cbtPreview.description")}
            </p>

            <div className="mt-8 space-y-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-brand-600">
                    <MaterialIcon name={f.icon} className="text-base" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-2 shadow-2xl sm:p-4">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ms-2 font-mono text-[11px] text-slate-400">portal.almunirat.org/cbt/exam-104</span>
                </div>
              </div>
              <div className="space-y-4 p-5 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">{t("home.cbtPreview.mockSubject")}</p>
                    <p className="mt-1 text-lg font-bold text-white">{t("home.cbtPreview.mockQuestion", { current: 4, total: 20 })}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-white">
                    <MaterialIcon name="timer" className="text-base text-rose-400" />
                    18:42
                  </div>
                </div>
                <div dir="rtl" className="rounded-2xl bg-slate-800 p-5 font-arabic text-2xl leading-loose text-white">
                  اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {OPTIONS.map((opt, i) => (
                    <div
                      key={opt}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                        i === 1
                          ? "border-brand-500 bg-brand-500/10 text-brand-200"
                          : "border-slate-700 bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
