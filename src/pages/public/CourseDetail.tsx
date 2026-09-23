import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { NotFound } from "@/components/states/NotFound";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pickLocalized } from "@/lib/localized";
import { publicApi } from "@/api/public";
import { ApiClientError } from "@/api/client";

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();

  const courseQuery = useQuery({
    queryKey: ["public", "course", slug],
    queryFn: () => publicApi.course(slug as string),
    enabled: Boolean(slug),
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.isNotFound) return false;
      return failureCount < 2;
    },
  });

  if (!slug || (courseQuery.error instanceof ApiClientError && courseQuery.error.isNotFound)) {
    return <NotFound homeHref="/courses" />;
  }

  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <QueryState
          isLoading={courseQuery.isLoading}
          error={courseQuery.error}
          data={courseQuery.data}
          onRetry={() => courseQuery.refetch()}
        >
          {(course) => {
            const title = pickLocalized(course.name, course.arabic_name, i18n.language);
            const description = pickLocalized(course.description ?? "", course.arabic_description, i18n.language);

            return (
              <>
                <nav className="mb-6 text-xs font-medium text-slate-500">
                  <Link to="/courses" className="hover:text-brand-600">
                    {t("courseDetail.breadcrumbCourses")}
                  </Link>
                  <span className="mx-1.5">/</span>
                  <span className="text-slate-700">{course.name}</span>
                </nav>

                <div className="relative mb-8 h-64 w-full overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 shadow-sm sm:h-80">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 via-sky-50 to-blue-100">
                      <MaterialIcon name="menu_book" className="text-7xl text-brand-300" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                  <div className="lg:col-span-8">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {course.class?.name && (
                        <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                          {course.class.name}
                        </span>
                      )}
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                        {course.language}
                      </span>
                      {course.duration && (
                        <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                          <MaterialIcon name="schedule" className="text-sm" />
                          {course.duration}
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

                    {course.teacher_name && (
                      <div className="mt-4 flex items-center gap-3 border-y border-slate-100 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-brand-600">
                          <MaterialIcon name="person" className="text-xl" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{course.teacher_name}</div>
                          <div className="text-xs text-slate-500">{t("courseDetail.instructorLabel")}</div>
                        </div>
                      </div>
                    )}

                    <div
                      dir={description.isArabic ? "rtl" : undefined}
                      className={cn(
                        "mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base",
                        description.isArabic && "text-end font-arabic",
                      )}
                    >
                      {description.text}
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="sticky top-24 rounded-3xl border border-slate-100 bg-slate-50/60 p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900">{t("courseDetail.enrollBoxTitle")}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        {t("courseDetail.enrollBoxDesc")}
                      </p>
                      <Button asChild size="lg" className="mt-5 h-auto w-full rounded-2xl py-3.5 text-sm">
                        <Link to="/register">
                          {t("courseDetail.enrollNow")}
                          <MaterialIcon name="arrow_forward" className="text-base" />
                        </Link>
                      </Button>
                      <Link
                        to="/contact"
                        className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        {t("courseDetail.contactQuestion")}
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            );
          }}
        </QueryState>
      </div>
    </section>
  );
}
