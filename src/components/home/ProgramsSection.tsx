import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { PublicCourseCard } from "@/components/public/PublicCourseCard";
import { publicApi } from "@/api/public";

export function ProgramsSection() {
  const { t } = useTranslation();
  const coursesQuery = useQuery({
    queryKey: ["public", "courses", { per_page: 4 }],
    queryFn: () => publicApi.courses({ per_page: 4 }),
  });

  return (
    <section className="bg-white py-20 lg:py-28" id="curriculum">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("home.programs.eyebrow")}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {t("home.programs.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("home.programs.description")}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700 lg:self-auto"
          >
            {t("home.programs.viewAll")}
            <MaterialIcon name="arrow_forward" className="text-sm" />
          </Link>
        </div>

        <QueryState
          isLoading={coursesQuery.isLoading}
          error={coursesQuery.error}
          data={coursesQuery.data}
          onRetry={() => coursesQuery.refetch()}
          isEmpty={(d) => d.items.length === 0}
          emptyProps={{ icon: "menu_book", title: t("home.programs.emptyTitle"), description: t("home.programs.emptyDescription") }}
        >
          {(data) => (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {data.items.map((course) => (
                <PublicCourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </QueryState>
      </div>
    </section>
  );
}
