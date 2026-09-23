import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { QueryState } from "@/components/states/QueryState";
import { Input } from "@/components/ui/input";
import { studentCoursesApi } from "@/api/student";

export default function StudentCoursesListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const coursesQuery = useQuery({
    queryKey: ["student", "courses", { search: debouncedSearch, per_page: 24 }],
    queryFn: () => studentCoursesApi.list({ search: debouncedSearch || undefined, per_page: 24 }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentCourses.eyebrow")}</span>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentCourses.title")}</h1>
        </div>
        <div className="relative w-full sm:w-72">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("studentCourses.searchPlaceholder")}
            className="h-11 rounded-xl border-slate-200/90 bg-white pl-10"
          />
        </div>
      </div>

      <QueryState
        isLoading={coursesQuery.isLoading}
        error={coursesQuery.error}
        data={coursesQuery.data}
        onRetry={() => coursesQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{
          icon: "menu_book",
          title: search ? t("studentCourses.emptySearchTitle") : t("studentCourses.emptyTitle"),
          description: search ? t("studentCourses.emptySearchDescription") : t("studentCourses.emptyDescription"),
        }}
      >
        {(data) => (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
