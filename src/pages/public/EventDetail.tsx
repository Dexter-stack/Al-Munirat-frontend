import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { NotFound } from "@/components/states/NotFound";
import { cn } from "@/lib/utils";
import { pickLocalized } from "@/lib/localized";
import { publicApi } from "@/api/public";
import { ApiClientError } from "@/api/client";

function formatEventDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();

  const eventQuery = useQuery({
    queryKey: ["public", "event", slug],
    queryFn: () => publicApi.event(slug as string),
    enabled: Boolean(slug),
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.isNotFound) return false;
      return failureCount < 2;
    },
  });

  if (!slug || (eventQuery.error instanceof ApiClientError && eventQuery.error.isNotFound)) {
    return <NotFound homeHref="/events" />;
  }

  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-8">
        <QueryState
          isLoading={eventQuery.isLoading}
          error={eventQuery.error}
          data={eventQuery.data}
          onRetry={() => eventQuery.refetch()}
        >
          {(event) => {
            const title = pickLocalized(event.title, event.arabic_title, i18n.language);
            const content = pickLocalized(event.content, event.arabic_content, i18n.language);
            const dateLabel = formatEventDate(event.event_date ?? event.published_at);

            return (
              <>
                <nav className="mb-6 text-xs font-medium text-slate-500">
                  <Link to="/events" className="hover:text-brand-600">
                    {t("eventDetail.breadcrumbEvents")}
                  </Link>
                  <span className="mx-1.5">/</span>
                  <span className="text-slate-700">{event.title}</span>
                </nav>

                <div className="relative mb-8 h-56 w-full overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 shadow-sm sm:h-72">
                  {event.featured_image_url ? (
                    <img src={event.featured_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-brand-50">
                      <MaterialIcon name="calendar_today" className="text-6xl text-brand-300" />
                    </div>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {event.category && (
                    <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                      {event.category}
                    </span>
                  )}
                  {dateLabel && (
                    <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      <MaterialIcon name="event" className="text-sm" />
                      {dateLabel}
                    </span>
                  )}
                </div>

                <h1
                  dir={title.isArabic ? "rtl" : undefined}
                  className={cn(
                    "text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl",
                    title.isArabic && "text-end font-arabic",
                  )}
                >
                  {title.text}
                </h1>

                {/*
                  The API sends event content as a plain string, not verified HTML —
                  we render it as paragraphs split on blank lines rather than using
                  dangerouslySetInnerHTML until the backend's content format (plain
                  text vs. sanitized HTML) is confirmed in API_DOCUMENTATION.md.
                */}
                <div
                  dir={content.isArabic ? "rtl" : undefined}
                  className={cn(
                    "prose-content mt-8 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base",
                    content.isArabic && "text-end font-arabic",
                  )}
                >
                  {content.text.split(/\n{2,}/).map((paragraph, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </>
            );
          }}
        </QueryState>
      </div>
    </section>
  );
}
