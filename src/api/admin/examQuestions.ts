import { apiClient, unwrap } from "@/api/client";
import type { ExamQuestionAdmin, QuestionType } from "@/types/exam";

export interface ExamQuestionOptionPayload {
  id?: number;
  option_text: string;
  arabic_option_text?: string;
  is_correct: boolean;
  order?: number;
}

/**
 * Matches Backend-Almunirah/API_DOCUMENTATION.md §12: questions are managed
 * as a nested resource under one exam — no cross-exam reuse, no separate
 * options endpoint. If `options` is included on update it fully replaces
 * the existing set (delete-and-recreate, not a diff).
 */
export interface ExamQuestionPayload {
  question_text: string;
  arabic_question_text?: string;
  type: QuestionType;
  marks?: number;
  order?: number;
  options: ExamQuestionOptionPayload[];
}

export const adminExamQuestionsApi = {
  list: (examId: number) => unwrap<ExamQuestionAdmin[]>(apiClient.get(`/admin/exams/${examId}/questions`)),
  get: (examId: number, questionId: number) =>
    unwrap<ExamQuestionAdmin>(apiClient.get(`/admin/exams/${examId}/questions/${questionId}`)),
  create: (examId: number, payload: ExamQuestionPayload) =>
    unwrap<ExamQuestionAdmin>(apiClient.post(`/admin/exams/${examId}/questions`, payload)),
  update: (examId: number, questionId: number, payload: Partial<ExamQuestionPayload>) =>
    unwrap<ExamQuestionAdmin>(apiClient.put(`/admin/exams/${examId}/questions/${questionId}`, payload)),
  remove: (examId: number, questionId: number) =>
    apiClient.delete(`/admin/exams/${examId}/questions/${questionId}`),
};
