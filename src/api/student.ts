import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type {
  Assignment,
  Course,
  Material,
} from "@/types/academic";
import type {
  CreatePaymentPayload,
  Payment,
  PaymentInstructions,
} from "@/types/payment";
import type {
  Exam,
  ExamAttempt,
  SaveAnswersPayload,
  StartExamResponse,
} from "@/types/exam";
import type { ExamResult, OverallProgress } from "@/types/result";
import type { AppNotification } from "@/types/notification";

export const paymentApi = {
  instructions: () => unwrap<PaymentInstructions>(apiClient.get("/payment/instructions")),

  create: (payload: CreatePaymentPayload) => unwrap<Payment>(apiClient.post("/student/payments", payload)),

  uploadReceipt: (
    paymentId: number,
    payload: { receipt: File; amount: number; payment_date: string; reference: string },
    onUploadProgress?: (percent: number) => void,
  ) => {
    const form = new FormData();
    form.append("receipt", payload.receipt);
    form.append("amount", String(payload.amount));
    form.append("payment_date", payload.payment_date);
    form.append("reference", payload.reference);
    return unwrap<Payment>(
      apiClient.post(`/student/payments/${paymentId}/receipt`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (onUploadProgress && evt.total) {
            onUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      }),
    );
  },

  list: () => unwrap<Payment[]>(apiClient.get("/student/payments")),

  get: (id: number) => unwrap<Payment>(apiClient.get(`/student/payments/${id}`)),

  /**
   * Receipts are private files (API_CONTRACT.md §11) — streamed through an
   * authenticated endpoint, never a bare URL. Returns an object URL the
   * caller must revoke after use.
   */
  downloadReceiptBlobUrl: async (paymentId: number) => {
    const res = await apiClient.get(`/student/payments/${paymentId}/receipt/download`, { responseType: "blob" });
    return URL.createObjectURL(res.data as Blob);
  },
};

export const studentCoursesApi = {
  list: (params?: ListParams) => unwrapPaginated<Course>(apiClient.get("/student/courses", { params })),
  get: (id: number) => unwrap<Course>(apiClient.get(`/student/courses/${id}`)),
};

export const studentMaterialsApi = {
  list: (params?: ListParams) => unwrapPaginated<Material>(apiClient.get("/student/materials", { params })),
  get: (id: number) => unwrap<Material>(apiClient.get(`/student/materials/${id}`)),
  /**
   * Private files are streamed through an authenticated endpoint, never a
   * bare storage URL (API_CONTRACT.md §11). Returns an object URL the
   * caller must revoke after use.
   */
  downloadBlobUrl: async (id: number) => {
    const res = await apiClient.get(`/student/materials/${id}/download`, { responseType: "blob" });
    return URL.createObjectURL(res.data as Blob);
  },
};

export const studentAssignmentsApi = {
  list: (params?: ListParams) => unwrapPaginated<Assignment>(apiClient.get("/student/assignments", { params })),
  get: (id: number) => unwrap<Assignment>(apiClient.get(`/student/assignments/${id}`)),
  /** At least one attachment is required — there's no text-only submission (API_DOCUMENTATION.md §10). */
  submit: (id: number, attachments: File[]) => {
    const form = new FormData();
    attachments.forEach((file) => form.append("attachments[]", file));
    return unwrap<Assignment>(
      apiClient.post(`/student/assignments/${id}/submit`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  /** The assignment's own (admin-provided) instructions attachment — not the student's submission. */
  downloadAttachmentBlobUrl: async (assignmentId: number, attachmentId: number) => {
    const res = await apiClient.get(`/student/assignments/${assignmentId}/attachments/${attachmentId}/download`, {
      responseType: "blob",
    });
    return URL.createObjectURL(res.data as Blob);
  },
};

export const studentExamsApi = {
  list: (params?: ListParams) => unwrapPaginated<Exam>(apiClient.get("/student/exams", { params })),
  get: (examId: number) => unwrap<Exam>(apiClient.get(`/student/exams/${examId}`)),
  /** `{ attempt, server_time, questions }` — 201 for a new attempt, 200 when resuming one already in progress. */
  start: (examId: number) => unwrap<StartExamResponse>(apiClient.post(`/student/exams/${examId}/start`)),
  /** Same `{ attempt, server_time, questions }` shape as `start`, with previously saved answers reflected. */
  resume: (examId: number, attemptId: number) =>
    unwrap<StartExamResponse>(apiClient.get(`/student/exams/${examId}/attempts/${attemptId}`)),
  saveAnswers: (examId: number, attemptId: number, payload: SaveAnswersPayload) =>
    apiClient.post(`/student/exams/${examId}/attempts/${attemptId}/answers`, payload),
  /** Idempotent — safe to call twice (e.g. a timer-expiry race); always returns the final result. */
  submit: (examId: number, attemptId: number) =>
    unwrap<ExamAttempt>(apiClient.post(`/student/exams/${examId}/attempts/${attemptId}/submit`)),
};

export const studentResultsApi = {
  list: () => unwrap<ExamResult[]>(apiClient.get("/student/results")),
  get: (id: number) => unwrap<ExamResult>(apiClient.get(`/student/results/${id}`)),
};

export const studentProgressApi = {
  overview: () => unwrap<OverallProgress>(apiClient.get("/student/progress")),
};

export const notificationsApi = {
  list: (params?: ListParams) => unwrapPaginated<AppNotification>(apiClient.get("/notifications", { params })),
  markRead: (id: number) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post("/notifications/read-all"),
};
