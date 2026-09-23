import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { ContentLanguage } from "@/types/academic";
import type { Exam, ExamStatus } from "@/types/exam";

/** Matches Backend-Almunirah/API_DOCUMENTATION.md §12's store/update body exactly. */
export interface ExamPayload {
  title: string;
  arabic_title?: string;
  description?: string;
  arabic_description?: string;
  course_id?: number | null;
  class_id?: number | null;
  language: ContentLanguage;
  duration_minutes: number;
  pass_mark: number;
  /** Informational only — the live scoring denominator is always the sum of question marks. */
  total_marks?: number;
  /** Defaults to 1 server-side if omitted. */
  max_attempts?: number;
  status?: ExamStatus;
  starts_at?: string | null;
  ends_at?: string | null;
}

export const adminExamsApi = {
  list: (params?: ListParams) => unwrapPaginated<Exam>(apiClient.get("/admin/exams", { params })),
  get: (id: number) => unwrap<Exam>(apiClient.get(`/admin/exams/${id}`)),
  create: (payload: ExamPayload) => unwrap<Exam>(apiClient.post("/admin/exams", payload)),
  update: (id: number, payload: Partial<ExamPayload>) => unwrap<Exam>(apiClient.put(`/admin/exams/${id}`, payload)),
  // No dedicated publish/close endpoint (§12) — lifecycle changes go through
  // this same update call via `status`, same precedent as assignments (§10).
  publish: (id: number) => adminExamsApi.update(id, { status: "published" }),
  close: (id: number) => adminExamsApi.update(id, { status: "closed" }),
  remove: (id: number) => apiClient.delete(`/admin/exams/${id}`),
};
