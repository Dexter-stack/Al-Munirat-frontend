import type { ContentLanguage } from "./academic";

export type QuestionType = "multiple_choice" | "true_false" | "multiple_answer";
export type ExamStatus = "draft" | "published" | "closed";
/** Informational only, derived server-side from starts_at/ends_at — real enforcement happens in `start`. */
export type ExamAvailability = "upcoming" | "open" | "closed";
export type ExamAttemptStatus = "in_progress" | "submitted";

/**
 * Matches Backend-Almunirah/API_DOCUMENTATION.md §12 exactly. No embedded
 * `course`/`class` objects — same convention as Material/Assignment
 * (src/types/academic.ts): just the ids, resolved against a courses/classes
 * list by the consuming page.
 */
export interface Exam {
  id: number;
  course_id: number | null;
  class_id: number | null;
  title: string;
  arabic_title?: string | null;
  description?: string | null;
  arabic_description?: string | null;
  language: ContentLanguage;
  duration_minutes: number;
  /** Decimal cast — arrives as a string, e.g. "2.00". Absolute marks threshold, not a percentage. */
  pass_mark: string;
  /**
   * Decimal cast, nullable — informational only. The real scoring
   * denominator is always the live sum of question marks at score time, so
   * this can drift from reality if questions change after it's set.
   */
  total_marks: string | null;
  max_attempts: number;
  status: ExamStatus;
  starts_at?: string | null;
  ends_at?: string | null;
  availability: ExamAvailability;
  question_count: number;
  /** Only present on /student/exams* responses — submitted-attempt count for the caller. */
  attempts_used?: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: number;
  option_text: string;
  arabic_option_text?: string | null;
  order?: number;
}

/** Admin-only — carries `is_correct`. Never sent to a student-facing endpoint. */
export interface QuestionOptionAdmin extends QuestionOption {
  is_correct: boolean;
}

/**
 * Question payload as sent to students (start/resume). Never carries
 * `is_correct` or any correct-answer marker on its options — verified live
 * by the backend (grepped an entire /start response, zero matches).
 */
export interface ExamQuestion {
  id: number;
  question_text: string;
  arabic_question_text?: string | null;
  type: QuestionType;
  /** Decimal cast, e.g. "1.00". */
  marks: string;
  order: number;
  options: QuestionOption[];
  /** [] on a fresh attempt; reflects previously saved answers on resume. */
  selected_option_ids: number[];
}

/** Admin-only view of a question — options carry `is_correct`. */
export interface ExamQuestionAdmin {
  id: number;
  question_text: string;
  arabic_question_text?: string | null;
  type: QuestionType;
  marks: string;
  order: number;
  options: QuestionOptionAdmin[];
}

export interface ExamAttempt {
  id: number;
  exam_id: number;
  user_id: number;
  status: ExamAttemptStatus;
  started_at: string;
  /** Absolute deadline timestamp; countdown = ends_at - server_time, re-synced on every resume. */
  ends_at: string;
  submitted_at: string | null;
  /** Decimal cast, null until scored. */
  score: string | null;
  total_marks: string | null;
  percentage: string | null;
  passed: boolean | null;
  /** Present on admin attempt-listing responses only. */
  user?: { id: number; first_name: string; last_name: string; email: string };
}

/** `{ attempt, server_time, questions }` — shared by both `start` and the resume (`GET .../attempts/{attempt}`) endpoints. */
export interface StartExamResponse {
  attempt: ExamAttempt;
  /** Authoritative clock — the frontend never trusts the device clock. */
  server_time: string;
  questions: ExamQuestion[];
}

export interface SaveAnswersPayload {
  answers: { question_id: number; selected_option_ids: number[] }[];
}

/**
 * Admin-only — the one place a student's selections and the correct answers
 * appear side by side, for `GET /admin/exams/{exam}/attempts/{attempt}`.
 */
export interface AdminAttemptReview {
  attempt: ExamAttempt;
  questions: (ExamQuestionAdmin & { selected_option_ids: number[] })[];
}
