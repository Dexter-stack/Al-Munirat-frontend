import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { cn } from "@/lib/utils";
import { pickLocalized } from "@/lib/localized";
import type { Course } from "@/types/academic";

/**
 * Public catalog course card — links to /courses/:slug and shows no
 * progress (unlike src/components/dashboard/CourseCard.tsx, which is
 * student-context and links to /student/courses/:id). Reused by
 * CoursesList.tsx; kept here so it isn't duplicated if other public pages
 * grow their own course grids later.
 */
export function PublicCourseCard({ course }: { course: Course }) {
  const { t, i18n } = useTranslation();
  const title = pickLocalized(course.name, course.arabic_name, i18n.language);
  const description = pickLocalized(course.description ?? "", course.arabic_description, i18n.language);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:border-brand-200 hover:shadow-xl"
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-sky-100">
            <MaterialIcon name="menu_book" className="text-5xl text-brand-300" />
          </div>
        )}
        {course.class?.name && (
          <div className="absolute top-3 start-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur-md">
            {course.class.name}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3
          dir={title.isArabic ? "rtl" : undefined}
          className={cn(
            "text-base font-bold text-slate-900 transition-colors group-hover:text-brand-600",
            title.isArabic && "text-end font-arabic",
          )}
        >
          {title.text}
        </h3>
        <p
          dir={description.isArabic ? "rtl" : undefined}
          className={cn(
            "mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500",
            description.isArabic && "text-end font-arabic",
          )}
        >
          {description.text}
        </p>
        <div className="mt-4 space-y-1.5 text-[11px] text-slate-500">
          {course.teacher_name && (
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="person" className="text-xs text-brand-600" />
              <span>{course.teacher_name}</span>
            </div>
          )}
          {course.duration && (
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="schedule" className="text-xs text-slate-400" />
              <span>{course.duration}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="translate" className="text-xs text-slate-400" />
            <span className="capitalize">{course.language}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-700">{t("courseCard.viewCourse")}</span>
          <MaterialIcon name="chevron_right" className="text-sm text-brand-600" />
        </div>
      </div>
    </Link>
  );
}
