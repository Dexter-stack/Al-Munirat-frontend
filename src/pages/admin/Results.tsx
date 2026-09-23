import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { QueryState } from "@/components/states/QueryState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminResultsApi } from "@/api/admin/results";
import { ApiClientError } from "@/api/client";

export default function AdminResultsPage() {
  const { t } = useTranslation();
  const PUBLISHED_FILTERS = [
    { value: "all", label: t("adminResults.filterAll") },
    { value: "true", label: t("adminResults.filterPublished") },
    { value: "false", label: t("adminResults.filterUnpublished") },
  ] as const;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [publishedFilter, setPublishedFilter] = useState<string>("all");

  const resultsQuery = useQuery({
    queryKey: ["admin", "results", { page, publishedFilter }],
    queryFn: () =>
      adminResultsApi.list({
        page,
        published: publishedFilter === "all" ? undefined : publishedFilter === "true",
      }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      publish ? adminResultsApi.publish(id) : adminResultsApi.unpublish(id),
    onSuccess: (_data, variables) => {
      toast.success(variables.publish ? t("adminResults.toastPublished") : t("adminResults.toastUnpublished"));
      queryClient.invalidateQueries({ queryKey: ["admin", "results"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminResults.toastActionError")),
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminResults.title")}
        description={t("adminResults.subtitle")}
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={publishedFilter}
          onValueChange={(v) => {
            setPublishedFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PUBLISHED_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState
        isLoading={resultsQuery.isLoading}
        error={resultsQuery.error}
        data={resultsQuery.data}
        onRetry={() => resultsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{
          icon: "military_tech",
          title: t("adminResults.emptyTitle"),
          description: t("adminResults.emptyDescription"),
        }}
      >
        {(data) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminResults.colExam")}</TableHead>
                    <TableHead>{t("adminResults.colCourse")}</TableHead>
                    <TableHead>{t("adminResults.colScore")}</TableHead>
                    <TableHead>{t("adminResults.colPercentage")}</TableHead>
                    <TableHead>{t("adminResults.colGrade")}</TableHead>
                    <TableHead>{t("adminResults.colResult")}</TableHead>
                    <TableHead>{t("adminResults.colVisibility")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate font-semibold text-slate-900">{result.exam.title}</p>
                        <p className="text-xs text-slate-500">{new Date(result.taken_at).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell className="text-slate-600">{result.course.title}</TableCell>
                      <TableCell className="text-slate-600">
                        {result.score} / {result.total_marks}
                      </TableCell>
                      <TableCell className="text-slate-600">{result.percentage}%</TableCell>
                      <TableCell className="font-semibold text-slate-900">{result.grade}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            result.passed
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-rose-100 bg-rose-50 text-rose-700"
                          }
                        >
                          {result.passed ? t("adminResults.resultPass") : t("adminResults.resultFail")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            result.published
                              ? "border-brand-100 bg-brand-50 text-brand-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }
                        >
                          {result.published ? t("adminShared.statusContent.published") : t("adminShared.statusContent.draft")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={publishMutation.isPending}
                          onClick={() => publishMutation.mutate({ id: result.id, publish: !result.published })}
                        >
                          <MaterialIcon
                            name={result.published ? "visibility_off" : "visibility"}
                            className="text-base"
                          />
                          {result.published ? t("common.unpublish") : t("common.publish")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <AdminPagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </QueryState>
    </div>
  );
}
