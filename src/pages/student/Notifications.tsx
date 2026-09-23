import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/states/QueryState";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { notificationsApi } from "@/api/student";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";

const PER_PAGE = 10;

export default function StudentNotificationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const params = { page, per_page: PER_PAGE };

  const notificationsQuery = useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationsApi.list(params),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success(t("studentNotifications.toastAllReadSuccess"));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error(t("studentNotifications.toastAllReadError")),
  });

  function handleClick(n: AppNotification) {
    if (!n.read_at) markReadMutation.mutate(n.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentNotifications.eyebrow")}</span>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentNotifications.title")}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={markAllReadMutation.isPending}
          onClick={() => markAllReadMutation.mutate()}
          className="rounded-xl text-xs font-semibold"
        >
          <MaterialIcon name="done_all" className="text-base" />
          {t("studentNotifications.markAllRead")}
        </Button>
      </div>

      <QueryState
        isLoading={notificationsQuery.isLoading}
        error={notificationsQuery.error}
        data={notificationsQuery.data}
        onRetry={() => notificationsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{ icon: "notifications", title: t("studentNotifications.emptyTitle"), description: t("studentNotifications.emptyDescription") }}
      >
        {(data) => (
          <>
            <div className="flex flex-col gap-2.5">
              {data.items.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                      isUnread
                        ? "border-brand-200/70 border-l-4 border-l-brand-500 bg-sky-50/30 hover:bg-sky-50/60"
                        : "border-slate-100 bg-white hover:bg-slate-50/60",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        isUnread ? "bg-brand-100 text-brand-700" : "bg-slate-50 text-slate-500",
                      )}
                    >
                      <MaterialIcon name="notifications" className="text-base" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm", isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>
                          {n.title}
                        </p>
                        {isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {data.meta.last_page > 1 && (
              <Pagination>
                <PaginationContent>
                  {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
