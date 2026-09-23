export interface ExamResult {
  id: number;
  exam: { id: number; title: string };
  course: { id: number; title: string };
  attempt_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  published: boolean;
  taken_at: string;
}

export interface CourseProgress {
  course: { id: number; title: string; cover_image_url?: string };
  completion_percent: number;
  lessons_completed: number;
  lessons_total: number;
  assignments_completed: number;
  assignments_total: number;
  tests_completed: number;
  tests_total: number;
  average_score: number;
}

export interface OverallProgress {
  overall_percent: number;
  courses: CourseProgress[];
}
