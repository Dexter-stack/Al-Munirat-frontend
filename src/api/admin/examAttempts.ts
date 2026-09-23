import { apiClient, unwrap } from "@/api/client";
import type { AdminAttemptReview, ExamAttempt } from "@/types/exam";

/**
 * Matches Backend-Almunirah/API_DOCUMENTATION.md §12. Not paginated — same
 * "bounded roster" assumption as enrollments/submissions. Each attempt is
 * passed through the same lazy expiry check as the student endpoints, so a
 * stale `in_progress` row finalizes the moment an admin looks at the list.
 */
export const adminExamAttemptsApi = {
  list: (examId: number) => unwrap<ExamAttempt[]>(apiClient.get(`/admin/exams/${examId}/attempts`)),
  /** The one place a student's selections and the correct answers appear side by side. */
  get: (examId: number, attemptId: number) =>
    unwrap<AdminAttemptReview>(apiClient.get(`/admin/exams/${examId}/attempts/${attemptId}`)),
};
