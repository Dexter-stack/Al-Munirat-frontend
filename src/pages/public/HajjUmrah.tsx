import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { PageHeader } from "@/components/public/PageHeader";
import { HajjUmrahSpotlight } from "@/components/home/HajjUmrahSpotlight";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { pickLocalized } from "@/lib/localized";
import { publicApi } from "@/api/public";
import type { HajjUmrahPackage } from "@/types/content";

function PackageCard({ pkg }: { pkg: HajjUmrahPackage }) {
  const { t, i18n } = useTranslation();
  const title = pickLocalized(pkg.title, pkg.arabic_title, i18n.language);
  const description = pickLocalized(pkg.description, pkg.arabic_description, i18n.language);

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:border-brand-200 hover:shadow-lg">
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        {pkg.featured_image_url ? (
          <img src={pkg.featured_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-sky-100">
            <MaterialIcon name="mosque" className="text-4xl text-brand-300" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3
          dir={title.isArabic ? "rtl" : undefined}
          className={cn("text-base font-bold text-slate-900", title.isArabic && "text-end font-arabic")}
        >
          {title.text}
        </h3>
        <p
          dir={description.isArabic ? "rtl" : undefined}
          className={cn("mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500", description.isArabic && "text-end font-arabic")}
        >
          {description.text}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          {pkg.duration_days != null && (
            <span className="flex items-center gap-1">
              <MaterialIcon name="calendar_month" className="text-sm text-brand-600" />
              {t("hajjUmrahPage.durationDays", { count: pkg.duration_days })}
            </span>
          )}
          {pkg.price != null && (
            <span className="text-sm font-extrabold text-brand-700">
              {pkg.currency ?? ""} {pkg.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PackagesSection({ label, packages }: { label: string; packages: HajjUmrahPackage[] }) {
  const { t } = useTranslation();
  if (packages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center text-sm text-slate-500">
        {t("hajjUmrahPage.noPackages", { label })}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}

export default function HajjUmrahPage() {
  const { t, i18n } = useTranslation();

  const MANASIK_POINTS = [
    { icon: "school", title: t("home.hajjSpotlight.servicesManasikTitle"), desc: t("home.hajjSpotlight.servicesManasikDesc") },
    { icon: "group", title: t("home.hajjSpotlight.servicesScholarsTitle"), desc: t("home.hajjSpotlight.servicesScholarsDesc") },
    { icon: "hotel", title: t("home.hajjSpotlight.servicesComfortTitle"), desc: t("home.hajjSpotlight.servicesComfortDesc") },
    { icon: "badge", title: t("home.hajjSpotlight.servicesClearanceTitle"), desc: t("home.hajjSpotlight.servicesClearanceDesc") },
  ];

  const packagesQuery = useQuery({
    queryKey: ["public", "hajj-umrah", "packages"],
    queryFn: () => publicApi.hajjUmrahPackages(),
  });

  const faqsQuery = useQuery({
    queryKey: ["public", "hajj-umrah", "faqs"],
    queryFn: () => publicApi.hajjUmrahFaqs(),
  });

  const announcementsQuery = useQuery({
    queryKey: ["public", "hajj-umrah", "announcements"],
    queryFn: () => publicApi.hajjUmrahAnnouncements(),
  });

  return (
    <>
      <PageHeader
        eyebrow={t("hajjUmrahPage.eyebrow")}
        title={t("hajjUmrahPage.title")}
        arabicTitle="رحلتك إلى بيت الله الحرام بوعي وإتقان وإخلاص"
        description={t("hajjUmrahPage.description")}
        icon="flight_takeoff"
      />

      <section className="bg-white py-16 lg:py-20" id="hajj-packages">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("hajjUmrahPage.hajjPackagesTitle")}</h2>
          <QueryState
            isLoading={packagesQuery.isLoading}
            error={packagesQuery.error}
            data={packagesQuery.data}
            onRetry={() => packagesQuery.refetch()}
          >
            {(packages) => <PackagesSection label={t("hajjUmrahPage.hajjLabel")} packages={packages.filter((p) => p.type === "hajj")} />}
          </QueryState>
        </div>
      </section>

      <section className="bg-slate-50/50 py-16 lg:py-20" id="umrah-packages">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("hajjUmrahPage.umrahPackagesTitle")}</h2>
          <QueryState
            isLoading={packagesQuery.isLoading}
            error={packagesQuery.error}
            data={packagesQuery.data}
            onRetry={() => packagesQuery.refetch()}
          >
            {(packages) => <PackagesSection label={t("hajjUmrahPage.umrahLabel")} packages={packages.filter((p) => p.type === "umrah")} />}
          </QueryState>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("hajjUmrahPage.manasikEyebrow")}
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("hajjUmrahPage.whatsIncludedTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MANASIK_POINTS.map((s) => (
              <div key={s.title} className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MaterialIcon name={s.icon} className="text-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                  <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/50 py-16 lg:py-20" id="faq">
        <div className="mx-auto max-w-3xl px-4 sm:px-8">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t("hajjUmrahPage.faqTitle")}
          </h2>
          <QueryState
            isLoading={faqsQuery.isLoading}
            error={faqsQuery.error}
            data={faqsQuery.data}
            onRetry={() => faqsQuery.refetch()}
            isEmpty={(d) => d.length === 0}
            emptyProps={{ icon: "help", title: t("hajjUmrahPage.faqEmptyTitle"), description: t("hajjUmrahPage.faqEmptyDescription") }}
          >
            {(faqs) => (
              <Accordion type="single" collapsible className="rounded-3xl border border-slate-100 bg-white px-6 shadow-sm">
                {faqs.map((faq) => {
                  const question = pickLocalized(faq.question, faq.arabic_question, i18n.language);
                  const answer = pickLocalized(faq.answer, faq.arabic_answer, i18n.language);
                  return (
                    <AccordionItem key={faq.id} value={String(faq.id)}>
                      <AccordionTrigger
                        dir={question.isArabic ? "rtl" : undefined}
                        className={cn("text-sm font-bold text-slate-900", question.isArabic && "text-end font-arabic")}
                      >
                        {question.text}
                      </AccordionTrigger>
                      <AccordionContent
                        dir={answer.isArabic ? "rtl" : undefined}
                        className={cn("text-sm leading-relaxed text-slate-600", answer.isArabic && "text-end font-arabic")}
                      >
                        {answer.text}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </QueryState>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20" id="announcements">
        <div className="mx-auto max-w-3xl px-4 sm:px-8">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t("hajjUmrahPage.announcementsTitle")}
          </h2>
          <QueryState
            isLoading={announcementsQuery.isLoading}
            error={announcementsQuery.error}
            data={announcementsQuery.data}
            onRetry={() => announcementsQuery.refetch()}
            isEmpty={(d) => d.length === 0}
            emptyProps={{ icon: "campaign", title: t("hajjUmrahPage.announcementsEmptyTitle"), description: t("hajjUmrahPage.announcementsEmptyDescription") }}
          >
            {(announcements) => (
              <div className="space-y-4">
                {announcements.map((a) => {
                  const title = pickLocalized(a.title, a.arabic_title, i18n.language);
                  const body = pickLocalized(a.body, a.arabic_body, i18n.language);
                  const publishedDate = new Date(a.published_at);
                  const formatted = Number.isNaN(publishedDate.getTime())
                    ? null
                    : publishedDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
                  return (
                    <div key={a.id} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                        <MaterialIcon name="campaign" className="text-xl" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4
                            dir={title.isArabic ? "rtl" : undefined}
                            className={cn("text-sm font-bold text-slate-900", title.isArabic && "font-arabic")}
                          >
                            {title.text}
                          </h4>
                          {formatted && <span className="text-[11px] text-slate-400">{formatted}</span>}
                        </div>
                        <p
                          dir={body.isArabic ? "rtl" : undefined}
                          className={cn("mt-1 text-xs leading-relaxed text-slate-500", body.isArabic && "text-end font-arabic")}
                        >
                          {body.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </QueryState>
        </div>
      </section>

      <HajjUmrahSpotlight />
    </>
  );
}
