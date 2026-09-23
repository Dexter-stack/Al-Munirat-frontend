import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { PageHeader } from "@/components/public/PageHeader";
import { PublicCourseCard } from "@/components/public/PublicCourseCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { publicApi } from "@/api/public";

const PER_PAGE = 12;
const ALL_LEVELS = "all";

export default function CoursesListPage() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [levelId, setLevelId] = useState<string>(ALL_LEVELS);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, levelId]);

  const levelsQuery = useQuery({
    queryKey: ["public", "class-levels"],
    queryFn: () => publicApi.classLevels(),
  });

  const coursesQuery = useQuery({
    queryKey: ["public", "courses", { page, per_page: PER_PAGE, search, levelId }],
    queryFn: () =>
      publicApi.courses({
        page,
        per_page: PER_PAGE,
        search: search || undefined,
        level_id: levelId === ALL_LEVELS ? undefined : Number(levelId),
      }),
    placeholderData: (previous) => previous,
  });

  const levels = levelsQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow={t("courseCatalog.eyebrow")}
        title={t("courseCatalog.title")}
        description={t("courseCatalog.description")}
        icon="menu_book"
      />

      <section className="bg-white pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("courseCatalog.searchPlaceholder")}
                className="h-11 rounded-xl bg-slate-50 ps-10"
                aria-label={t("courseCatalog.searchAriaLabel")}
              />
            </div>
            <Select value={levelId} onValueChange={setLevelId}>
              <SelectTrigger className="h-11 w-full rounded-xl bg-slate-50 sm:w-56">
                <SelectValue placeholder={t("courseCatalog.levelsPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LEVELS}>{t("courseCatalog.allLevels")}</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={String(level.id)}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <QueryState
            isLoading={coursesQuery.isLoading}
            error={coursesQuery.error}
            data={coursesQuery.data}
            onRetry={() => coursesQuery.refetch()}
            isEmpty={(d) => d.items.length === 0}
            emptyProps={{
              icon: "menu_book",
              title: t("courseCatalog.emptyTitle"),
              description: t("courseCatalog.emptyDescription"),
            }}
          >
            {(data) => (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {data.items.map((course) => (
                    <PublicCourseCard key={course.id} course={course} />
                  ))}
                </div>

                {data.meta.last_page > 1 && (
                  <Pagination className="mt-12">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage((p) => Math.max(1, p - 1));
                          }}
                          className={data.meta.current_page <= 1 ? "pointer-events-none opacity-50" : undefined}
                        />
                      </PaginationItem>
                      {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={p === data.meta.current_page}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(p);
                            }}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage((p) => Math.min(data.meta.last_page, p + 1));
                          }}
                          className={
                            data.meta.current_page >= data.meta.last_page ? "pointer-events-none opacity-50" : undefined
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </QueryState>
        </div>
      </section>
    </>
  );
}
