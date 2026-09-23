import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { Assignment, AssignmentLifecycleStatus, AssignmentSubmission } from "@/types/academic";

/** Matches Backend-Almunirah/API_DOCUMENTATION.md §10's store/update body exactly. */
export interface AssignmentPayload {
  title: string;
  arabic_title?: string;
  description?: string;
  arabic_description?: string;
  course_id?: number | null;
  class_id?: number | null;
  /** Full datetime — a due TIME matters for "late" determination. */
  due_date?: string;
  maximum_score?: number;
  status?: AssignmentLifecycleStatus;
  attachments?: File[];
}

function toFormData(payload: Partial<AssignmentPayload>) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "attachments" && Array.isArray(value)) {
      value.forEach((file: File) => form.append("attachments[]", file));
      return;
    }
    form.append(key, value as string | Blob);
  });
  return form;
}

export const adminAssignmentsApi = {
  list: (params?: ListParams) => unwrapPaginated<Assignment>(apiClient.get("/admin/assignments", { params })),
  get: (id: number) => unwrap<Assignment>(apiClient.get(`/admin/assignments/${id}`)),
  create: (payload: AssignmentPayload) =>
    unwrap<Assignment>(
      apiClient.post("/admin/assignments", toFormData(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ),
  // No dedicated publish/close endpoint (API_DOCUMENTATION.md §10) —
  // lifecycle changes go through this same update call via `status`.
  // PHP does not populate file uploads on PUT — method-spoof via POST +
  // _method=PUT when attaching new files.
  update: (id: number, payload: Partial<AssignmentPayload>) => {
    if (payload.attachments?.length) {
      return unwrap<Assignment>(
        apiClient.post(`/admin/assignments/${id}?_method=PUT`, toFormData(payload), {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      );
    }
    const { attachments: _attachments, ...rest } = payload;
    return unwrap<Assignment>(apiClient.put(`/admin/assignments/${id}`, rest));
  },
  publish: (id: number) => adminAssignmentsApi.update(id, { status: "published" }),
  close: (id: number) => adminAssignmentsApi.update(id, { status: "closed" }),
  remove: (id: number) => apiClient.delete(`/admin/assignments/${id}`),

  downloadAttachmentBlobUrl: async (assignmentId: number, attachmentId: number) => {
    const res = await apiClient.get(`/admin/assignments/${assignmentId}/attachments/${attachmentId}/download`, {
      responseType: "blob",
    });
    return URL.createObjectURL(res.data as Blob);
  },

  submissions: (assignmentId: number) =>
    unwrap<AssignmentSubmission[]>(apiClient.get(`/admin/assignments/${assignmentId}/submissions`)),
  submission: (assignmentId: number, submissionId: number) =>
    unwrap<AssignmentSubmission>(apiClient.get(`/admin/assignments/${assignmentId}/submissions/${submissionId}`)),
  grade: (assignmentId: number, submissionId: number, payload: { score: number; feedback?: string }) =>
    unwrap<AssignmentSubmission>(
      apiClient.post(`/admin/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload),
    ),
  downloadSubmissionAttachmentBlobUrl: async (assignmentId: number, submissionId: number, attachmentId: number) => {
    const res = await apiClient.get(
      `/admin/assignments/${assignmentId}/submissions/${submissionId}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    return URL.createObjectURL(res.data as Blob);
  },
};
