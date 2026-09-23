import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { QueryState } from "@/components/states/QueryState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notificationsApi } from "@/api/student";
import { ApiClientError } from "@/api/client";
import type { AppNotification } from "@/types/notification";

export default function AdminNotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", { page }],
    queryFn: () => notificationsApi.list({ page }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminNotifications.toastMarkReadError")),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success(t("adminNotifications.toastMarkAllReadSuccess"));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminNotifications.toastMarkAllReadError")),
  });

  function handleClick(notification: AppNotification) {
    if (!notification.read_at) {
      markReadMutation.mutate(notification.id);
    }
  }

  const hasUnread = (notificationsQuery.data?.items ?? []).some((n) => !n.read_at);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminNotifications.title")}
        description={t("adminNotifications.subtitle")}
        action={
          <Button variant="outline" disabled={!hasUnread || markAllReadMutation.isPending} onClick={() => markAllReadMutation.mutate()}>
            <MaterialIcon name="done_all" className="text-base" />
            {t("adminNotifications.markAllRead")}
          </Button>
        }
      />

      <QueryState
        isLoading={notificationsQuery.isLoading}
        error={notificationsQuery.error}
        data={notificationsQuery.data}
        onRetry={() => notificationsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{ icon: "notifications", title: t("adminNotifications.emptyTitle"), description: t("adminNotifications.emptyDescription") }}
      >
        {(data) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="flex flex-col gap-2">
              {data.items.map((notification) => {
                const isUnread = !notification.read_at;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleClick(notification)}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                      isUnread
                        ? "border-brand-200 bg-brand-50/40 hover:bg-brand-50/70"
                        : "border-slate-100 bg-white hover:bg-slate-50",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        isUnread ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <MaterialIcon name="notifications" className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("truncate text-sm", isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>
                          {notification.title}
                        </p>
                        {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{notification.body}</p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <AdminPagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </QueryState>
    </div>
  );
}
