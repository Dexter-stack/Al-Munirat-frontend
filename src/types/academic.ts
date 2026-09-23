export type ContentLanguage = "english" | "arabic" | "both";

/** Matches Backend-Almunirah/API_DOCUMENTATION.md §6 (SchoolClass). */
export interface ClassLevel {
  id: number;
  name: string;
  arabic_name?: string | null;
  description?: string | null;
  status: "active" | "inactive";
}

export type CourseStatus = "draft" | "published" | "archived";

/**
 * Matches API_DOCUMENTATION.md §7 exactly. No `teacher` entity exists yet
 * on the backend (`teacher_name` is a free-text string), and there is no
 * `lessons_count`/`progress_percent`/`last_activity_at` on Course — per-
 * student progress lives on `CourseProgress` (src/types/result.ts) once a
 * progress endpoint exists, not here.
 */
export interface Course {
  id: number;
  slug: string;
  name: string;
  arabic_name?: string | null;
  description?: string | null;
  arabic_description?: string | null;
  class_id: number | null;
  class: ClassLevel | null;
  language: ContentLanguage;
  status: CourseStatus;
  /** Free-text, e.g. "8 weeks" — no fixed unit on the backend. */
  duration?: string | null;
  thumbnail_url?: string | null;
  teacher_name?: string | null;
  created_at: string;
  updated_at: string;
}

/** Matches API_DOCUMENTATION.md §8 — nested under a course, admin-only so far. */
export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  user?: { id: number; first_name: string; last_name: string; email: string };
  status: "active" | "completed" | "dropped";
  completion_percentage: number;
  enrolled_at: string;
  completed_at?: string | null;
}

/** Matches API_DOCUMENTATION.md §9 exactly — "text" replaces the "notes" the frontend guessed at. */
export type MaterialType = "pdf" | "video" | "audio" | "document" | "image" | "text";
export type MaterialStatus = "draft" | "published";

export interface Material {
  id: number;
  course_id: number | null;
  class_id: number | null;
  title: string;
  arabic_title?: string | null;
  description?: string | null;
  arabic_description?: string | null;
  type: MaterialType;
  original_filename: string;
  mime_type: string;
  file_size: number;
  status: MaterialStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** Matches API_DOCUMENTATION.md §10 exactly (Phase 5, live). Assignment
 * lifecycle (admin-controlled) — NOT the same concept as a student's
 * submission status below; the backend keeps these as two separate fields.
 */
export type AssignmentLifecycleStatus = "draft" | "published" | "closed";

/**
 * `not_started` is computed (no submission row exists yet). `in_progress`
 * is defined by the original spec but unreachable in this backend build —
 * there's no draft-save endpoint — so it never actually appears; kept out
 * of this union rather than modeled as reachable.
 */
export type SubmissionStatus = "not_started" | "submitted" | "late" | "graded";

export interface AssignmentAttachment {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  user?: { id: number; first_name: string; last_name: string; email: string };
  status: "submitted" | "late" | "graded";
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_by: number | null;
  graded_at: string | null;
  attachments: AssignmentAttachment[];
}

export interface Assignment {
  id: number;
  course_id: number | null;
  class_id: number | null;
  title: string;
  arabic_title?: string | null;
  description?: string | null;
  arabic_description?: string | null;
  /** Full datetime (a due TIME matters for "late" determination), not date-only. */
  due_date: string | null;
  /** Decimal cast — arrives as a string, e.g. "50.00". */
  maximum_score: string;
  status: AssignmentLifecycleStatus;
  attachments: AssignmentAttachment[];
  /** Only present on student-facing responses — never on admin CRUD responses. */
  submission_status?: SubmissionStatus;
  submission?: AssignmentSubmission | null;
  created_at: string;
  updated_at: string;
}
