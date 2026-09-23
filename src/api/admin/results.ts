import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { ExamResult } from "@/types/result";

export const adminResultsApi = {
  list: (params?: ListParams) => unwrapPaginated<ExamResult>(apiClient.get("/admin/results", { params })),
  get: (id: number) => unwrap<ExamResult>(apiClient.get(`/admin/results/${id}`)),
  publish: (id: number) => unwrap<ExamResult>(apiClient.post(`/admin/results/${id}/publish`)),
  unpublish: (id: number) => unwrap<ExamResult>(apiClient.post(`/admin/results/${id}/unpublish`)),
};
