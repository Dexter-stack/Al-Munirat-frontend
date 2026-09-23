import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { AccountStatusBadge } from "@/components/admin/StatusBadge";
import { SuspendStudentDialog } from "@/components/admin/SuspendStudentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { adminStudentsApi } from "@/api/admin/students";
import { adminClassesApi } from "@/api/admin/classes";
import { ApiClientError } from "@/api/client";
import type { AccountStatus, User } from "@/types/auth";

export default function AdminStudentsPage() {
  const { t } = useTranslation();
  const STATUS_OPTIONS: { value: AccountStatus | "all"; label: string }[] = [
    { value: "all", label: t("adminShared.allStatuses") },
    { value: "pending_payment", label: t("adminShared.statusAccount.pending_payment") },
    { value: "receipt_submitted", label: t("adminShared.statusAccount.receipt_submitted") },
    { value: "under_review", label: t("adminShared.statusAccount.under_review") },
    { value: "payment_rejected", label: t("adminShared.statusAccount.payment_rejected") },
    { value: "active", label: t("adminShared.statusAccount.active") },
    { value: "suspended", label: t("adminShared.statusAccount.suspended") },
  ];
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);

  // Debounce the free-text search so we don't refetch on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const studentsQuery = useQuery({
    queryKey: ["admin", "students", { page, search, status }],
    queryFn: () =>
      adminStudentsApi.list({
        page,
        per_page: 15,
        search: search || undefined,
        status: status === "all" ? undefined : status,
      }),
  });

  const classesQuery = useQuery({ queryKey: ["admin", "classes", "all"], queryFn: () => adminClassesApi.list() });
  const classNameById = useMemo(() => {
    const map = new Map<number, string>();
    classesQuery.data?.items.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classesQuery.data]);

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminStudentsApi.approve(id),
    onSuccess: () => {
      toast.success(t("adminStudents.toastApproved"));
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminStudents.toastApproveError"));
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminStudentsApi.suspend(id, reason),
    onSuccess: () => {
      toast.success(t("adminStudents.toastSuspended"));
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      setSuspendTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminStudents.toastSuspendError"));
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("adminStudents.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("adminStudents.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("adminStudents.searchPlaceholder")}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as AccountStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-56">
            <SelectValue placeholder={t("adminShared.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <QueryState
          isLoading={studentsQuery.isLoading}
          error={studentsQuery.error}
          data={studentsQuery.data}
          onRetry={() => studentsQuery.refetch()}
          isEmpty={(d) => d.items.length === 0}
          emptyProps={{ icon: "groups", title: t("adminStudents.emptyTitle"), description: t("adminStudents.emptyDescription") }}
        >
          {(data) => (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminStudents.colStudent")}</TableHead>
                    <TableHead>{t("adminStudents.colPhone")}</TableHead>
                    <TableHead>{t("adminStudents.colClass")}</TableHead>
                    <TableHead>{t("adminStudents.colAccountStatus")}</TableHead>
                    <TableHead>{t("adminStudents.colDateJoined")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Link to={`/admin/students/${student.id}`} className="flex flex-col hover:underline">
                          <span className="font-semibold text-slate-900">
                            {student.first_name} {student.last_name}
                          </span>
                          <span className="text-xs text-slate-500">{student.email}</span>
                        </Link>
                      </TableCell>
                      <TableCell>{student.phone || "—"}</TableCell>
                      <TableCell>
                        {student.class_id ? (classNameById.get(student.class_id) ?? `#${student.class_id}`) : "—"}
                      </TableCell>
                      <TableCell>
                        <AccountStatusBadge status={student.account_status} />
                      </TableCell>
                      <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MaterialIcon name="more_vert" className="text-lg" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/students/${student.id}`}>
                                <MaterialIcon name="visibility" className="text-base" />
                                {t("common.view")}
                              </Link>
                            </DropdownMenuItem>
                            {student.account_status !== "active" && (
                              <DropdownMenuItem
                                onClick={() => approveMutation.mutate(student.id)}
                                disabled={approveMutation.isPending}
                              >
                                <MaterialIcon name="check_circle" className="text-base" />
                                {t("common.approve")}
                              </DropdownMenuItem>
                            )}
                            {student.account_status === "active" && (
                              <DropdownMenuItem variant="destructive" onClick={() => setSuspendTarget(student)}>
                                <MaterialIcon name="block" className="text-base" />
                                {t("adminStudents.suspend")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    {t("adminStudents.pageInfo", {
                      current: data.meta.current_page,
                      last: data.meta.last_page,
                      total: data.meta.total,
                    })}
                  </p>
                  <Pagination className="mx-0 w-auto">
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
                </div>
              )}
            </>
          )}
        </QueryState>
      </div>

      {suspendTarget && (
        <SuspendStudentDialog
          open={Boolean(suspendTarget)}
          onOpenChange={(open) => !open && setSuspendTarget(null)}
          studentName={`${suspendTarget.first_name} ${suspendTarget.last_name}`}
          isSubmitting={suspendMutation.isPending}
          onConfirm={(reason) => suspendMutation.mutate({ id: suspendTarget.id, reason })}
        />
      )}
    </div>
  );
}
