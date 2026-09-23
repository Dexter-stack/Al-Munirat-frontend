import type { MockContext } from "@/api/mocks/context";
import { currentUser } from "@/api/mocks/context";
import { fail, forbidden, notFound, ok, okPaginated, paginate, unauthorized, validationError } from "@/api/mocks/envelope";
import {
  assignmentForStudent,
  assignments,
  assignmentSubmissions,
  autoSubmitIfExpired,
  courses,
  examAttempts,
  examAvailability,
  examResults,
  exams,
  gradeFromPercentage,
  ids,
  inMinutes,
  materials,
  nowIso,
  saveAnswer,
  studentQuestionsFor,
  submitAttempt,
  toExam,
} from "@/api/mocks/db";
import type { MockRoute } from "@/api/mocks/router";
import type { MockResult } from "@/api/mocks/envelope";
import type { User } from "@/types/auth";

type AuthResult = { ok: true; user: User } | { ok: false; error: MockResult };

function requireActiveStudent(ctx: MockContext): AuthResult {
  const user = currentUser(ctx);
  if (!user) return { ok: false, error: unauthorized() };
  if (user.account_status !== "active") {
    return { ok: false, error: forbidden("Your account must be active to access this resource.") };
  }
  return { ok: true, user };
}

export const studentRoutes: MockRoute[] = [
  // --- Courses ---
  {
    method: "get",
    path: "/student/courses",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      // API_DOCUMENTATION.md §7 access model: class match, or an
      // unrestricted (class_id: null) course. Enrollment-based access
      // isn't consulted here yet — admin-only in the mock for now.
      const visible = courses.filter(
        (c) => c.status === "published" && (c.class_id === null || c.class_id === auth.user.class_id),
      );
      const { items, meta } = paginate(visible, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/student/courses/:id",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const course = courses.find((c) => c.id === Number(ctx.params.id));
      if (!course) return notFound("Course");
      return ok(course);
    },
  },

  // --- Materials ---
  {
    method: "get",
    path: "/student/materials",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      let list = materials.filter((m) => m.status === "published");
      const courseId = ctx.query.course_id as string | undefined;
      if (courseId) list = list.filter((m) => m.course_id === Number(courseId));
      const type = ctx.query.type as string | undefined;
      if (type) list = list.filter((m) => m.type === type);
      const search = ctx.query.search as string | undefined;
      if (search) list = list.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/student/materials/:id",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const material = materials.find((m) => m.id === Number(ctx.params.id));
      if (!material) return notFound("Material");
      return ok(material);
    },
  },
  {
    method: "get",
    path: "/student/materials/:id/download",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const material = materials.find((m) => m.id === Number(ctx.params.id));
      if (!material) return notFound("Material");
      // Real endpoint streams a file; the adapter passes this Blob straight
      // through instead of envelope-wrapping it (responseType: "blob").
      const text = `This is a mock file standing in for "${material.title}" (${material.type}).\nReplace VITE_USE_MOCKS with a real backend to serve the actual file.`;
      return { status: 200, data: new Blob([text], { type: "text/plain" }) };
    },
  },

  // --- Assignments (API_CONTRACT.md §10, live — Phase 5) ---
  {
    method: "get",
    path: "/student/assignments",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      let list = assignments.filter((a) => a.status !== "draft");
      const courseId = ctx.query.course_id as string | undefined;
      if (courseId) list = list.filter((a) => a.course_id === Number(courseId));
      const withSubmissions = list.map((a) => assignmentForStudent(a, auth.user.id));
      const { items, meta } = paginate(withSubmissions, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/student/assignments/:id",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const assignment = assignments.find((a) => a.id === Number(ctx.params.id) && a.status !== "draft");
      if (!assignment) return notFound("Assignment");
      return ok(assignmentForStudent(assignment, auth.user.id));
    },
  },
  {
    method: "post",
    path: "/student/assignments/:id/submit",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const assignment = assignments.find((a) => a.id === Number(ctx.params.id));
      if (!assignment) return notFound("Assignment");
      if (assignment.status === "closed") {
        return fail(409, "This assignment is closed and no longer accepts submissions.");
      }
      const files = (Array.isArray(ctx.body.attachments) ? ctx.body.attachments : []) as File[];
      if (files.length === 0) {
        return validationError({ attachments: ["At least one attachment is required."] });
      }

      let submission = assignmentSubmissions.find((s) => s.assignment_id === assignment.id && s.student_id === auth.user.id);
      if (submission?.status === "graded") {
        return fail(409, "This submission has already been graded and can no longer be changed.");
      }

      const isLate = Boolean(assignment.due_date && new Date(assignment.due_date).getTime() < Date.now());
      const newAttachments = files.map((file) => ({
        id: ids.attachment(),
        original_filename: file.name || "submission",
        mime_type: file.type || "application/octet-stream",
        file_size: file.size ?? 0,
        uploaded_at: nowIso(),
      }));

      if (submission) {
        submission.status = isLate ? "late" : "submitted";
        submission.submitted_at = nowIso();
        submission.attachments.push(...newAttachments); // append-only, per API_DOCUMENTATION.md §10
      } else {
        submission = {
          id: ids.submission(),
          assignment_id: assignment.id,
          student_id: auth.user.id,
          user_id: auth.user.id,
          user: { id: auth.user.id, first_name: auth.user.first_name, last_name: auth.user.last_name, email: auth.user.email },
          status: isLate ? "late" : "submitted",
          score: null,
          feedback: null,
          submitted_at: nowIso(),
          graded_by: null,
          graded_at: null,
          attachments: newAttachments,
        };
        assignmentSubmissions.push(submission);
      }

      return ok(assignmentForStudent(assignment, auth.user.id), "Assignment submitted successfully.");
    },
  },
  {
    method: "get",
    path: "/student/assignments/:assignmentId/attachments/:attachmentId/download",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const assignment = assignments.find((a) => a.id === Number(ctx.params.assignmentId));
      if (!assignment) return notFound("Assignment");
      const attachment = assignment.attachments.find((a) => a.id === Number(ctx.params.attachmentId));
      if (!attachment) return notFound("Attachment");
      const text = `Mock file standing in for "${attachment.original_filename}". Replace VITE_USE_MOCKS with a real backend to see the actual upload.`;
      return { status: 200, data: new Blob([text], { type: "text/plain" }) };
    },
  },

  // --- Exams / CBT (API_CONTRACT.md §9, API_DOCUMENTATION.md §12 — contract-frozen student flow) ---
  {
    method: "get",
    path: "/student/exams",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      // Draft exams stay hidden; closed ones stay visible so a student can see their history (§12).
      const visible = exams.filter((e) => e.status !== "draft");
      const { items, meta } = paginate(visible, ctx.query);
      return okPaginated(items.map((e) => toExam(e, auth.user.id)), meta);
    },
  },
  {
    method: "get",
    path: "/student/exams/:examId",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const exam = exams.find((e) => e.id === Number(ctx.params.examId));
      if (!exam || exam.status === "draft") return notFound("Exam");
      return ok(toExam(exam, auth.user.id));
    },
  },
  {
    method: "post",
    path: "/student/exams/:examId/start",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const exam = exams.find((e) => e.id === Number(ctx.params.examId));
      if (!exam) return notFound("Exam");
      if (exam.status !== "published") return fail(409, "This exam is not currently open.");
      if (examAvailability(exam) !== "open") return fail(409, "This exam is outside its scheduled window.");

      // Resuming an in-progress attempt instead of creating a second one is
      // the correct UX for a student who refreshed mid-exam (§12).
      let attempt = examAttempts.find((a) => a.exam_id === exam.id && a.user_id === auth.user.id && a.status === "in_progress");
      let statusCode = 200;
      if (!attempt) {
        const submittedCount = examAttempts.filter(
          (a) => a.exam_id === exam.id && a.user_id === auth.user.id && a.status === "submitted",
        ).length;
        if (submittedCount >= exam.max_attempts) return fail(409, "You have used all your allowed attempts for this exam.");
        const serverTime = nowIso();
        attempt = {
          id: ids.attempt(),
          exam_id: exam.id,
          user_id: auth.user.id,
          status: "in_progress",
          started_at: serverTime,
          ends_at: inMinutes(exam.duration_minutes),
          submitted_at: null,
          score: null,
          total_marks: null,
          percentage: null,
          passed: null,
        };
        examAttempts.push(attempt);
        statusCode = 201;
      }
      return ok(
        {
          attempt,
          server_time: nowIso(),
          questions: studentQuestionsFor(exam.id, attempt.id),
        },
        "OK",
        statusCode,
      );
    },
  },
  {
    method: "get",
    path: "/student/exams/:examId/attempts/:attemptId",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const attempt = examAttempts.find((a) => a.id === Number(ctx.params.attemptId) && a.user_id === auth.user.id);
      if (!attempt || attempt.exam_id !== Number(ctx.params.examId)) return notFound("Exam attempt");
      // Auto-finalizes and returns the final state if the deadline has quietly passed (§12).
      autoSubmitIfExpired(attempt);
      return ok({
        attempt,
        server_time: nowIso(),
        questions: studentQuestionsFor(attempt.exam_id, attempt.id),
      });
    },
  },
  {
    method: "post",
    path: "/student/exams/:examId/attempts/:attemptId/answers",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const attempt = examAttempts.find((a) => a.id === Number(ctx.params.attemptId) && a.user_id === auth.user.id);
      if (!attempt || attempt.exam_id !== Number(ctx.params.examId)) return notFound("Exam attempt");
      autoSubmitIfExpired(attempt);
      if (attempt.status !== "in_progress") return fail(409, "This attempt is no longer accepting answers.");
      const answers = (ctx.body.answers as { question_id: number; selected_option_ids: number[] }[] | undefined) ?? [];
      answers.forEach((a) => saveAnswer(attempt.id, a.question_id, a.selected_option_ids));
      return ok(null, "Answers saved successfully");
    },
  },
  {
    method: "post",
    path: "/student/exams/:examId/attempts/:attemptId/submit",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const exam = exams.find((e) => e.id === Number(ctx.params.examId));
      const attempt = examAttempts.find((a) => a.id === Number(ctx.params.attemptId) && a.user_id === auth.user.id);
      if (!exam || !attempt || attempt.exam_id !== exam.id) return notFound("Exam attempt");

      // Idempotent by design — a double-submit or a submit-at-the-deadline
      // race both just return the final result, never an error (§12).
      submitAttempt(attempt);

      // Feeds the (still mock-only, pending Phase 7) student Results page —
      // decoupled from ExamAttempt, which never carries a grade/published flag.
      const course = courses.find((c) => c.id === exam.course_id);
      const percentage = Math.round(Number(attempt.percentage ?? 0));
      if (!examResults.some((r) => r.attempt_id === attempt.id)) {
        examResults.push({
          id: ids.result(),
          student_id: auth.user.id,
          exam: { id: exam.id, title: exam.title },
          course: { id: exam.course_id ?? 0, title: course?.name ?? "—" },
          attempt_id: attempt.id,
          score: Number(attempt.score ?? 0),
          total_marks: Number(attempt.total_marks ?? 0),
          percentage,
          grade: gradeFromPercentage(percentage),
          passed: attempt.passed ?? false,
          published: false,
          taken_at: attempt.submitted_at ?? nowIso(),
        });
      }
      return ok(attempt, "OK");
    },
  },

  // --- Results ---
  {
    method: "get",
    path: "/student/results",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const mine = examResults.filter((r) => r.student_id === auth.user.id && r.published);
      return ok(mine);
    },
  },
  {
    method: "get",
    path: "/student/results/:id",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const result = examResults.find((r) => r.id === Number(ctx.params.id) && r.student_id === auth.user.id && r.published);
      if (!result) return notFound("Result");
      return ok(result);
    },
  },

  // --- Progress ---
  // Not a backend concept yet (no Course Progress phase built) — this
  // whole handler is a forward guess, self-contained here rather than
  // adding invented fields onto the real Course type.
  {
    method: "get",
    path: "/student/progress",
    handler: (ctx: MockContext) => {
      const auth = requireActiveStudent(ctx);
      if (!auth.ok) return auth.error;
      const PROGRESS_SEED: Record<number, { completion_percent: number; lessons_total: number }> = {
        1: { completion_percent: 65, lessons_total: 24 },
        2: { completion_percent: 40, lessons_total: 18 },
        3: { completion_percent: 80, lessons_total: 16 },
      };
      const courseProgress = Object.entries(PROGRESS_SEED)
        .map(([courseIdStr, seed]) => {
          const courseId = Number(courseIdStr);
          const c = courses.find((course) => course.id === courseId);
          if (!c) return null;
          const courseAssignments = assignments.filter((a) => a.course_id === c.id);
          const courseExams = exams.filter((e) => e.course_id === c.id);
          const completedAssignments = courseAssignments.filter((a) =>
            assignmentSubmissions.some((s) => s.assignment_id === a.id && s.student_id === auth.user.id),
          );
          const attemptedExamIds = new Set(
            examAttempts.filter((a) => a.user_id === auth.user.id && a.status === "submitted").map((a) => a.exam_id),
          );
          return {
            course: { id: c.id, title: c.name, cover_image_url: c.thumbnail_url ?? undefined },
            completion_percent: seed.completion_percent,
            lessons_completed: Math.round((seed.completion_percent / 100) * seed.lessons_total),
            lessons_total: seed.lessons_total,
            assignments_completed: completedAssignments.length,
            assignments_total: courseAssignments.length,
            tests_completed: courseExams.filter((e) => attemptedExamIds.has(e.id)).length,
            tests_total: courseExams.length,
            average_score: 75,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
      const overall = courseProgress.length
        ? Math.round(courseProgress.reduce((sum, c) => sum + c.completion_percent, 0) / courseProgress.length)
        : 0;
      return ok({ overall_percent: overall, courses: courseProgress });
    },
  },
];
