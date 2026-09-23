import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { PageHeader } from "@/components/public/PageHeader";
import { PublicEventCard } from "@/components/public/PublicEventCard";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { publicApi } from "@/api/public";

const PER_PAGE = 9;

export default function EventsListPage() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const eventsQuery = useQuery({
    queryKey: ["public", "events", { page, per_page: PER_PAGE, search }],
    queryFn: () => publicApi.events({ page, per_page: PER_PAGE, search: search || undefined }),
    placeholderData: (previous) => previous,
  });

  return (
    <>
      <PageHeader
        eyebrow={t("eventCatalog.eyebrow")}
        title={t("eventCatalog.title")}
        description={t("eventCatalog.description")}
        icon="calendar_today"
      />

      <section className="bg-white pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="relative mb-8 max-w-md">
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("eventCatalog.searchPlaceholder")}
              className="h-11 rounded-xl bg-slate-50 ps-10"
              aria-label={t("eventCatalog.searchAriaLabel")}
            />
          </div>

          <QueryState
            isLoading={eventsQuery.isLoading}
            error={eventsQuery.error}
            data={eventsQuery.data}
            onRetry={() => eventsQuery.refetch()}
            isEmpty={(d) => d.items.length === 0}
            emptyProps={{
              icon: "calendar_today",
              title: t("eventCatalog.emptyTitle"),
              description: t("eventCatalog.emptyDescription"),
            }}
          >
            {(data) => (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {data.items.map((event) => (
                    <PublicEventCard key={event.id} event={event} />
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
