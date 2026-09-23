import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { cn } from "@/lib/utils";
import { pickLocalized } from "@/lib/localized";
import type { EventItem } from "@/types/content";

function formatEventDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function PublicEventCard({ event }: { event: EventItem }) {
  const { i18n } = useTranslation();
  const title = pickLocalized(event.title, event.arabic_title, i18n.language);
  const dateLabel = formatEventDate(event.event_date ?? event.published_at);

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:border-brand-200 hover:shadow-xl"
    >
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        {event.featured_image_url ? (
          <img
            src={event.featured_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-brand-50">
            <MaterialIcon name="calendar_today" className="text-5xl text-brand-300" />
          </div>
        )}
        {event.category && (
          <div className="absolute top-3 start-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-800 backdrop-blur-md">
            {event.category}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {dateLabel && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-brand-600">
            <MaterialIcon name="event" className="text-xs" />
            {dateLabel}
          </div>
        )}
        <h3
          dir={title.isArabic ? "rtl" : undefined}
          className={cn(
            "text-base font-bold text-slate-900 transition-colors group-hover:text-brand-600",
            title.isArabic && "text-end font-arabic",
          )}
        >
          {title.text}
        </h3>
        {event.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{event.excerpt}</p>}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-700">Read more</span>
          <MaterialIcon name="chevron_right" className="text-sm text-brand-600" />
        </div>
      </div>
    </Link>
  );
}
