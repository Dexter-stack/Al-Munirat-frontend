import type { AssignmentLifecycleStatus, SubmissionStatus } from "@/types/academic";

interface StatusStyle {
  badge: string;
  label: string;
}

/** Color-coding for a student's SubmissionStatus (not_started/submitted/late/graded). */
export const SUBMISSION_STATUS_STYLES: Record<SubmissionStatus, StatusStyle> = {
  not_started: { badge: "bg-slate-100 text-slate-600", label: "Not started" },
  submitted: { badge: "bg-amber-50 text-amber-700", label: "Submitted" },
  late: { badge: "bg-rose-50 text-rose-700", label: "Late" },
  graded: { badge: "bg-emerald-50 text-emerald-700", label: "Graded" },
};

/** Color-coding for an assignment's own lifecycle (admin-controlled). */
export const ASSIGNMENT_LIFECYCLE_STYLES: Record<AssignmentLifecycleStatus, StatusStyle> = {
  draft: { badge: "bg-slate-100 text-slate-600", label: "Draft" },
  published: { badge: "bg-emerald-50 text-emerald-700", label: "Published" },
  closed: { badge: "bg-rose-50 text-rose-700", label: "Closed" },
};
