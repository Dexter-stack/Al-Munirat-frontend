import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/types/academic";

interface CourseCardProps {
  course: Course;
  /**
   * Course has no per-student progress field (API_DOCUMENTATION.md §7) —
   * pass it in separately from a `/student/progress`-shaped source when
   * available; the bar is omitted otherwise.
   */
  progressPercent?: number;
}

export function CourseCard({ course, progressPercent }: CourseCardProps) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/student/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs transition-all hover:shadow-md"
    >
      <div className="relative h-40 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-sky-100">
            <MaterialIcon name="menu_book" className="text-4xl text-brand-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/10" />
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between text-white">
          <span className="text-sm font-bold">{course.name}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {course.teacher_name && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MaterialIcon name="person" className="text-sm text-brand-600" />
            <span>{course.teacher_name}</span>
          </div>
        )}
        {progressPercent !== undefined && (
          <>
            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{t("studentCourseCard.progress")}</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="mt-1.5 h-1.5" />
          </>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">{course.duration ?? course.class?.name ?? t("studentCourseCard.selfPaced")}</span>
          <span className="flex items-center gap-1 font-semibold text-brand-600 group-hover:text-brand-700">
            {t("studentCourseCard.continue")}
            <MaterialIcon name="arrow_forward" className="text-sm" />
          </span>
        </div>
      </div>
    </Link>
  );
}
