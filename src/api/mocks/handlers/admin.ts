import type { MockContext } from "@/api/mocks/context";
import { currentUser } from "@/api/mocks/context";
import { forbidden, notFound, ok, okPaginated, paginate, unauthorized, validationError } from "@/api/mocks/envelope";
import {
  answersForAttempt,
  assignments,
  assignmentSubmissions,
  autoSubmitIfExpired,
  classLevels,
  courses,
  events,
  examAttempts,
  exams,
  examQuestions,
  examResults,
  hajjUmrahAnnouncements,
  hajjUmrahFaqs,
  hajjUmrahPackages,
  ids,
  materials,
  notifications,
  nowIso,
  orgSettings,
  payments,
  toExam,
  users,
} from "@/api/mocks/db";
import type { MockExam } from "@/api/mocks/db";
import type { MockRoute } from "@/api/mocks/router";
import type { MockResult } from "@/api/mocks/envelope";
import type { ExamPayload } from "@/api/admin/exams";
import type { ExamQuestionPayload } from "@/api/admin/examQuestions";
import type { MaterialType } from "@/types/academic";
import type { User } from "@/types/auth";

type AuthResult = { ok: true; user: User } | { ok: false; error: MockResult };

function requireAdmin(ctx: MockContext): AuthResult {
  const user = currentUser(ctx);
  if (!user) return { ok: false, error: unauthorized() };
  if (user.role !== "admin") return { ok: false, error: forbidden() };
  return { ok: true, user };
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function userRef(userId: number) {
  const user = users.find((u) => u.id === userId);
  return user ? { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email } : undefined;
}

export const adminRoutes: MockRoute[] = [
  // --- Dashboard ---
  {
    method: "get",
    path: "/admin/dashboard/stats",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const students = users.filter((u) => u.role === "student");
      return ok({
        total_students: students.length,
        active_students: students.filter((u) => u.account_status === "active").length,
        pending_approvals: students.filter((u) => u.account_status === "receipt_submitted" || u.account_status === "under_review").length,
        pending_payments: payments.filter((p) => p.status === "pending" || p.status === "under_review").length,
        courses_count: courses.length,
        upcoming_tests: exams.filter((e) => e.status === "published").length,
        assignments_count: assignments.length,
        published_results: examResults.filter((r) => r.published).length,
      });
    },
  },

  // --- Students ---
  {
    method: "get",
    path: "/admin/students",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      let list = users.filter((u) => u.role === "student");
      const status = ctx.query.status as string | undefined;
      if (status) list = list.filter((u) => u.account_status === status);
      const search = ctx.query.search as string | undefined;
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((u) => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q));
      }
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/students/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const student = users.find((u) => u.id === Number(ctx.params.id) && u.role === "student");
      if (!student) return notFound("Student");
      return ok(student);
    },
  },
  {
    method: "put",
    path: "/admin/students/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const student = users.find((u) => u.id === Number(ctx.params.id) && u.role === "student");
      if (!student) return notFound("Student");
      Object.assign(student, ctx.body);
      return ok(student, "Student updated.");
    },
  },
  {
    method: "post",
    path: "/admin/students/:id/approve",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const student = users.find((u) => u.id === Number(ctx.params.id) && u.role === "student");
      if (!student) return notFound("Student");
      student.account_status = "active";
      student.rejection_reason = null;
      return ok(student, "Student approved.");
    },
  },
  {
    method: "post",
    path: "/admin/students/:id/suspend",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const student = users.find((u) => u.id === Number(ctx.params.id) && u.role === "student");
      if (!student) return notFound("Student");
      student.account_status = "suspended";
      if (ctx.body.reason) student.rejection_reason = String(ctx.body.reason);
      return ok(student, "Student suspended.");
    },
  },

  // --- Classes ---
  {
    method: "get",
    path: "/admin/classes",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const { items, meta } = paginate(classLevels, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/classes/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const level = classLevels.find((c) => c.id === Number(ctx.params.id));
      if (!level) return notFound("Class");
      return ok(level);
    },
  },
  {
    method: "post",
    path: "/admin/classes",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      if (!ctx.body.name) return validationError({ name: ["The name field is required."] });
      const level = {
        id: Math.max(0, ...classLevels.map((c) => c.id)) + 1,
        name: String(ctx.body.name),
        arabic_name: ctx.body.arabic_name as string | undefined,
        description: ctx.body.description as string | undefined,
        status: (ctx.body.status as "active" | "inactive" | undefined) ?? "active",
      };
      classLevels.push(level);
      return ok(level, "Class created successfully.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/classes/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const level = classLevels.find((c) => c.id === Number(ctx.params.id));
      if (!level) return notFound("Class");
      Object.assign(level, ctx.body);
      return ok(level, "Class updated.");
    },
  },
  {
    method: "delete",
    path: "/admin/classes/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = classLevels.findIndex((c) => c.id === Number(ctx.params.id));
      if (index === -1) return notFound("Class");
      classLevels.splice(index, 1);
      return ok(null, "Class deleted.");
    },
  },

  // --- Courses (API_DOCUMENTATION.md §7) ---
  {
    method: "get",
    path: "/admin/courses",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      let list = courses;
      const search = ctx.query.search as string | undefined;
      if (search) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
      const status = ctx.query.status as string | undefined;
      if (status) list = list.filter((c) => c.status === status);
      const classId = ctx.query.class_id as string | undefined;
      if (classId) list = list.filter((c) => c.class_id === Number(classId));
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/courses/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const course = courses.find((c) => c.id === Number(ctx.params.id));
      if (!course) return notFound("Course");
      return ok(course);
    },
  },
  {
    method: "post",
    path: "/admin/courses",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body;
      if (!b.name) return validationError({ name: ["The name field is required."] });
      const classId = b.class_id ? Number(b.class_id) : null;
      const course = {
        id: ids.course(),
        slug: (b.slug as string | undefined) || `${slugify(String(b.name))}-${Math.random().toString(36).slice(2, 6)}`,
        name: String(b.name),
        arabic_name: b.arabic_name as string | undefined,
        description: b.description as string | undefined,
        arabic_description: b.arabic_description as string | undefined,
        class_id: classId,
        class: classId ? (classLevels.find((l) => l.id === classId) ?? null) : null,
        language: (b.language as "english" | "arabic" | "both") ?? "english",
        status: (b.status as "draft" | "published" | "archived" | undefined) ?? "draft",
        duration: b.duration as string | undefined,
        thumbnail_url: b.thumbnail instanceof File ? URL.createObjectURL(b.thumbnail) : undefined,
        teacher_name: b.teacher_name as string | undefined,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      courses.push(course);
      return ok(course, "Course created successfully.", 201);
    },
  },
  {
    method: "post",
    path: "/admin/courses/:id",
    handler: (ctx: MockContext) => {
      // adminCoursesApi.update() sends POST ...?_method=PUT (multipart method override) —
      // this route also stands in for a real .../publish|unpublish (there's no separate
      // endpoint on the backend; publishing is just a status update).
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const course = courses.find((c) => c.id === Number(ctx.params.id));
      if (!course) return notFound("Course");
      const b = ctx.body;
      if (b.name) course.name = String(b.name);
      if (b.arabic_name !== undefined) course.arabic_name = b.arabic_name as string;
      if (b.description !== undefined) course.description = b.description as string;
      if (b.arabic_description !== undefined) course.arabic_description = b.arabic_description as string;
      if (b.language) course.language = b.language as "english" | "arabic" | "both";
      if (b.status) course.status = b.status as "draft" | "published" | "archived";
      if (b.duration !== undefined) course.duration = b.duration as string;
      if (b.teacher_name !== undefined) course.teacher_name = b.teacher_name as string;
      if (b.class_id !== undefined) {
        const classId = b.class_id ? Number(b.class_id) : null;
        course.class_id = classId;
        course.class = classId ? (classLevels.find((l) => l.id === classId) ?? null) : null;
      }
      if (b.thumbnail instanceof File) course.thumbnail_url = URL.createObjectURL(b.thumbnail);
      course.updated_at = nowIso();
      return ok(course, "Course updated successfully.");
    },
  },
  {
    method: "delete",
    path: "/admin/courses/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = courses.findIndex((c) => c.id === Number(ctx.params.id));
      if (index === -1) return notFound("Course");
      courses.splice(index, 1);
      return ok(null, "Course deleted successfully.");
    },
  },

  // --- Materials (API_DOCUMENTATION.md §9) ---
  {
    method: "get",
    path: "/admin/materials",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      let list = materials;
      const courseId = ctx.query.course_id as string | undefined;
      if (courseId) list = list.filter((m) => m.course_id === Number(courseId));
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/materials/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const material = materials.find((m) => m.id === Number(ctx.params.id));
      if (!material) return notFound("Material");
      return ok(material);
    },
  },
  {
    method: "post",
    path: "/admin/materials",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body;
      if (!b.title || !b.type) return validationError({ title: ["The title field is required."] });
      const file = b.file instanceof File ? b.file : undefined;
      const material = {
        id: ids.material(),
        course_id: b.course_id ? Number(b.course_id) : null,
        class_id: b.class_id ? Number(b.class_id) : null,
        title: String(b.title),
        arabic_title: b.arabic_title as string | undefined,
        description: b.description as string | undefined,
        arabic_description: b.arabic_description as string | undefined,
        type: b.type as MaterialType,
        original_filename: file?.name ?? "material",
        mime_type: file?.type || "application/octet-stream",
        file_size: file?.size ?? 0,
        status: (b.status as "draft" | "published" | undefined) ?? "draft",
        published_at: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      materials.push(material);
      return ok(material, "Material created successfully.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/materials/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const material = materials.find((m) => m.id === Number(ctx.params.id));
      if (!material) return notFound("Material");
      const b = ctx.body;
      if (b.title) material.title = String(b.title);
      if (b.arabic_title !== undefined) material.arabic_title = b.arabic_title as string;
      if (b.description !== undefined) material.description = b.description as string;
      if (b.type) material.type = b.type as MaterialType;
      if (b.course_id !== undefined) material.course_id = b.course_id ? Number(b.course_id) : null;
      if (b.class_id !== undefined) material.class_id = b.class_id ? Number(b.class_id) : null;
      material.updated_at = nowIso();
      return ok(material, "Material updated successfully.");
    },
  },
  {
    method: "delete",
    path: "/admin/materials/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = materials.findIndex((m) => m.id === Number(ctx.params.id));
      if (index === -1) return notFound("Material");
      materials.splice(index, 1);
      return ok(null, "Material deleted successfully.");
    },
  },
  {
    method: "post",
    path: "/admin/materials/:id/publish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const material = materials.find((m) => m.id === Number(ctx.params.id));
      if (!material) return notFound("Material");
      material.status = "published";
      material.published_at = nowIso();
      return ok(material, "Material published successfully.");
    },
  },
  {
    method: "post",
    path: "/admin/materials/:id/unpublish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const material = materials.find((m) => m.id === Number(ctx.params.id));
      if (!material) return notFound("Material");
      material.status = "draft";
      material.published_at = null;
      return ok(material, "Material unpublished successfully.");
    },
  },

  // --- Assignments (API_DOCUMENTATION.md §10, live — Phase 5) ---
  {
    method: "get",
    path: "/admin/assignments",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      let list = assignments;
      const courseId = ctx.query.course_id as string | undefined;
      if (courseId) list = list.filter((a) => a.course_id === Number(courseId));
      const status = ctx.query.status as string | undefined;
      if (status) list = list.filter((a) => a.status === status);
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/assignments/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const assignment = assignments.find((a) => a.id === Number(ctx.params.id));
      if (!assignment) return notFound("Assignment");
      return ok(assignment);
    },
  },
  {
    method: "post",
    path: "/admin/assignments",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body;
      if (!b.title) return validationError({ title: ["The title field is required."] });
      const assignment = {
        id: ids.assignment(),
        course_id: b.course_id ? Number(b.course_id) : null,
        class_id: b.class_id ? Number(b.class_id) : null,
        title: String(b.title),
        arabic_title: (b.arabic_title as string | undefined) ?? null,
        description: (b.description as string | undefined) ?? null,
        arabic_description: (b.arabic_description as string | undefined) ?? null,
        due_date: (b.due_date as string | undefined) ?? null,
        maximum_score: b.maximum_score ? String(Number(b.maximum_score).toFixed(2)) : "100.00",
        status: (b.status as "draft" | "published" | "closed" | undefined) ?? "draft",
        attachments: [],
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      assignments.push(assignment);
      return ok(assignment, "Assignment created successfully.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/assignments/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const assignment = assignments.find((a) => a.id === Number(ctx.params.id));
      if (!assignment) return notFound("Assignment");
      const b = ctx.body;
      if (b.title) assignment.title = String(b.title);
      if (b.description !== undefined) assignment.description = b.description as string;
      if (b.due_date !== undefined) assignment.due_date = b.due_date as string;
      if (b.maximum_score) assignment.maximum_score = String(Number(b.maximum_score).toFixed(2));
      if (b.course_id !== undefined) assignment.course_id = b.course_id ? Number(b.course_id) : null;
      if (b.class_id !== undefined) assignment.class_id = b.class_id ? Number(b.class_id) : null;
      if (b.status) assignment.status = b.status as "draft" | "published" | "closed";
      assignment.updated_at = nowIso();
      return ok(assignment, "Assignment updated successfully.");
    },
  },
  {
    method: "delete",
    path: "/admin/assignments/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = assignments.findIndex((a) => a.id === Number(ctx.params.id));
      if (index === -1) return notFound("Assignment");
      assignments.splice(index, 1);
      return ok(null, "Assignment deleted successfully.");
    },
  },
  {
    method: "get",
    path: "/admin/assignments/:id/submissions",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const list = assignmentSubmissions.filter((s) => s.assignment_id === Number(ctx.params.id));
      return ok(list);
    },
  },
  {
    method: "get",
    path: "/admin/assignments/:assignmentId/submissions/:submissionId",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const submission = assignmentSubmissions.find(
        (s) => s.id === Number(ctx.params.submissionId) && s.assignment_id === Number(ctx.params.assignmentId),
      );
      if (!submission) return notFound("Submission");
      return ok(submission);
    },
  },
  {
    method: "post",
    path: "/admin/assignments/:assignmentId/submissions/:submissionId/grade",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const submission = assignmentSubmissions.find((s) => s.id === Number(ctx.params.submissionId));
      if (!submission) return notFound("Submission");
      const assignment = assignments.find((a) => a.id === submission.assignment_id);
      const score = Number(ctx.body.score);
      const max = assignment ? Number(assignment.maximum_score) : Infinity;
      if (Number.isNaN(score) || score < 0 || score > max) {
        return validationError({ score: [`The score field must be between 0 and ${max.toFixed(2)}.`] });
      }

      // Re-grading is allowed (overwrites); only the student's own resubmission is locked post-grading.
      submission.status = "graded";
      submission.score = score;
      submission.feedback = (ctx.body.feedback as string | undefined) ?? null;
      submission.graded_by = auth.user.id;
      submission.graded_at = nowIso();

      notifications.push({
        id: ids.notification(),
        user_id: submission.student_id,
        type: "assignment_graded",
        title: "Assignment graded",
        body: `Your submission for "${assignment?.title ?? "an assignment"}" was graded: ${submission.score}/${assignment?.maximum_score ?? "?"}.`,
        read_at: null,
        created_at: nowIso(),
      });
      return ok(submission, "Submission graded successfully.");
    },
  },
  {
    method: "get",
    path: "/admin/assignments/:assignmentId/attachments/:attachmentId/download",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const assignment = assignments.find((a) => a.id === Number(ctx.params.assignmentId));
      if (!assignment) return notFound("Assignment");
      const attachment = assignment.attachments.find((a) => a.id === Number(ctx.params.attachmentId));
      if (!attachment) return notFound("Attachment");
      const text = `Mock file standing in for "${attachment.original_filename}".`;
      return { status: 200, data: new Blob([text], { type: "text/plain" }) };
    },
  },
  {
    method: "get",
    path: "/admin/assignments/:assignmentId/submissions/:submissionId/attachments/:attachmentId/download",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const submission = assignmentSubmissions.find(
        (s) => s.id === Number(ctx.params.submissionId) && s.assignment_id === Number(ctx.params.assignmentId),
      );
      if (!submission) return notFound("Submission");
      const attachment = submission.attachments.find((a) => a.id === Number(ctx.params.attachmentId));
      if (!attachment) return notFound("Attachment");
      const text = `Mock file standing in for "${attachment.original_filename}".`;
      return { status: 200, data: new Blob([text], { type: "text/plain" }) };
    },
  },

  // --- Exams (API_DOCUMENTATION.md §12) ---
  {
    method: "get",
    path: "/admin/exams",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      let list = exams;
      const courseId = ctx.query.course_id as string | undefined;
      if (courseId) list = list.filter((e) => e.course_id === Number(courseId));
      const classId = ctx.query.class_id as string | undefined;
      if (classId) list = list.filter((e) => e.class_id === Number(classId));
      const status = ctx.query.status as string | undefined;
      if (status) list = list.filter((e) => e.status === status);
      const language = ctx.query.language as string | undefined;
      if (language) list = list.filter((e) => e.language === language);
      const search = (ctx.query.search as string | undefined)?.toLowerCase();
      if (search) list = list.filter((e) => e.title.toLowerCase().includes(search));
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items.map((e) => toExam(e)), meta);
    },
  },
  {
    method: "get",
    path: "/admin/exams/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const exam = exams.find((e) => e.id === Number(ctx.params.id));
      if (!exam) return notFound("Exam");
      return ok(toExam(exam));
    },
  },
  {
    method: "post",
    path: "/admin/exams",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body as unknown as ExamPayload;
      if (!b.title) return validationError({ title: ["The title field is required."] });
      const timestamp = nowIso();
      const exam: MockExam = {
        id: ids.exam(),
        course_id: b.course_id ?? null,
        class_id: b.class_id ?? null,
        title: b.title,
        arabic_title: b.arabic_title ?? null,
        description: b.description ?? null,
        arabic_description: b.arabic_description ?? null,
        language: b.language,
        duration_minutes: Number(b.duration_minutes),
        pass_mark: Number(b.pass_mark).toFixed(2),
        total_marks: b.total_marks !== undefined ? Number(b.total_marks).toFixed(2) : null,
        max_attempts: b.max_attempts ?? 1,
        status: b.status ?? "draft",
        starts_at: b.starts_at ?? null,
        ends_at: b.ends_at ?? null,
        created_at: timestamp,
        updated_at: timestamp,
      };
      exams.push(exam);
      return ok(toExam(exam), "Exam created.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/exams/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const exam = exams.find((e) => e.id === Number(ctx.params.id));
      if (!exam) return notFound("Exam");
      const b = ctx.body as Partial<ExamPayload>;
      if (b.title) exam.title = b.title;
      if (b.arabic_title !== undefined) exam.arabic_title = b.arabic_title;
      if (b.description !== undefined) exam.description = b.description;
      if (b.arabic_description !== undefined) exam.arabic_description = b.arabic_description;
      if (b.course_id !== undefined) exam.course_id = b.course_id;
      if (b.class_id !== undefined) exam.class_id = b.class_id;
      if (b.language) exam.language = b.language;
      if (b.duration_minutes) exam.duration_minutes = Number(b.duration_minutes);
      if (b.pass_mark !== undefined) exam.pass_mark = Number(b.pass_mark).toFixed(2);
      if (b.total_marks !== undefined) exam.total_marks = Number(b.total_marks).toFixed(2);
      if (b.max_attempts !== undefined) exam.max_attempts = b.max_attempts;
      if (b.status) exam.status = b.status;
      if (b.starts_at !== undefined) exam.starts_at = b.starts_at;
      if (b.ends_at !== undefined) exam.ends_at = b.ends_at;
      exam.updated_at = nowIso();
      return ok(toExam(exam), "Exam updated.");
    },
  },
  {
    method: "delete",
    path: "/admin/exams/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = exams.findIndex((e) => e.id === Number(ctx.params.id));
      if (index === -1) return notFound("Exam");
      exams.splice(index, 1);
      return ok(null, "Exam deleted.");
    },
  },

  // --- Exam questions — exam-exclusive, no cross-exam reuse (§12) ---
  {
    method: "get",
    path: "/admin/exams/:examId/questions",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const list = examQuestions
        .filter((q) => q.exam_id === Number(ctx.params.examId))
        .sort((a, b) => a.order - b.order);
      return ok(list);
    },
  },
  {
    method: "get",
    path: "/admin/exams/:examId/questions/:questionId",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const question = examQuestions.find(
        (q) => q.id === Number(ctx.params.questionId) && q.exam_id === Number(ctx.params.examId),
      );
      if (!question) return notFound("Question");
      return ok(question);
    },
  },
  {
    method: "post",
    path: "/admin/exams/:examId/questions",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const examId = Number(ctx.params.examId);
      if (!exams.some((e) => e.id === examId)) return notFound("Exam");
      const b = ctx.body as unknown as ExamQuestionPayload;
      if (!b.question_text || !b.options?.length || b.options.length < 2) {
        return validationError({ question_text: ["The question text field is required and needs at least two options."] });
      }
      if (b.type === "true_false" && b.options.length !== 2) {
        return validationError({ options: ["True/false questions must have exactly two options."] });
      }
      const correctCount = b.options.filter((o) => o.is_correct).length;
      if ((b.type === "multiple_choice" || b.type === "true_false") && correctCount !== 1) {
        return validationError({ options: ["This question type must have exactly one correct option."] });
      }
      if (b.type === "multiple_answer" && correctCount < 1) {
        return validationError({ options: ["At least one option must be marked correct."] });
      }
      const question = {
        id: ids.question(),
        exam_id: examId,
        question_text: b.question_text,
        arabic_question_text: b.arabic_question_text ?? null,
        type: b.type,
        marks: Number(b.marks ?? 1).toFixed(2),
        order: b.order ?? 0,
        options: b.options.map((o) => ({
          id: ids.option(),
          option_text: o.option_text,
          arabic_option_text: o.arabic_option_text ?? null,
          is_correct: o.is_correct,
          order: o.order,
        })),
      };
      examQuestions.push(question);
      return ok(question, "Question created.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/exams/:examId/questions/:questionId",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const question = examQuestions.find(
        (q) => q.id === Number(ctx.params.questionId) && q.exam_id === Number(ctx.params.examId),
      );
      if (!question) return notFound("Question");
      const b = ctx.body as Partial<ExamQuestionPayload>;
      if (b.question_text) question.question_text = b.question_text;
      if (b.arabic_question_text !== undefined) question.arabic_question_text = b.arabic_question_text;
      if (b.type) question.type = b.type;
      if (b.marks !== undefined) question.marks = Number(b.marks).toFixed(2);
      if (b.order !== undefined) question.order = b.order;
      // Replaces the existing option set wholesale — delete-and-recreate, not a diff (§12).
      if (b.options) {
        question.options = b.options.map((o) => ({
          id: ids.option(),
          option_text: o.option_text,
          arabic_option_text: o.arabic_option_text ?? null,
          is_correct: o.is_correct,
          order: o.order,
        }));
      }
      return ok(question, "Question updated.");
    },
  },
  {
    method: "delete",
    path: "/admin/exams/:examId/questions/:questionId",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = examQuestions.findIndex(
        (q) => q.id === Number(ctx.params.questionId) && q.exam_id === Number(ctx.params.examId),
      );
      if (index === -1) return notFound("Question");
      examQuestions.splice(index, 1);
      return ok(null, "Question deleted.");
    },
  },

  // --- Exam attempts (admin review — not paginated, same "bounded roster" as enrollments/submissions) ---
  {
    method: "get",
    path: "/admin/exams/:examId/attempts",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const examId = Number(ctx.params.examId);
      const list = examAttempts
        .filter((a) => a.exam_id === examId)
        .map((a) => autoSubmitIfExpired(a))
        .map((a) => ({ ...a, user: userRef(a.user_id) }))
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      return ok(list);
    },
  },
  {
    method: "get",
    path: "/admin/exams/:examId/attempts/:attemptId",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const attempt = examAttempts.find(
        (a) => a.id === Number(ctx.params.attemptId) && a.exam_id === Number(ctx.params.examId),
      );
      if (!attempt) return notFound("Exam attempt");
      autoSubmitIfExpired(attempt);
      const answers = answersForAttempt(attempt.id);
      const questions = examQuestions
        .filter((q) => q.exam_id === attempt.exam_id)
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          ...q,
          selected_option_ids: answers.find((a) => a.question_id === q.id)?.selected_option_ids ?? [],
        }));
      return ok({ attempt: { ...attempt, user: userRef(attempt.user_id) }, questions });
    },
  },

  // --- Results ---
  {
    method: "get",
    path: "/admin/results",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      let list = examResults;
      if (ctx.query.published !== undefined) {
        const wantPublished = ctx.query.published === "true" || ctx.query.published === true;
        list = list.filter((r) => r.published === wantPublished);
      }
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/results/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const result = examResults.find((r) => r.id === Number(ctx.params.id));
      if (!result) return notFound("Result");
      return ok(result);
    },
  },
  {
    method: "post",
    path: "/admin/results/:id/publish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const result = examResults.find((r) => r.id === Number(ctx.params.id));
      if (!result) return notFound("Result");
      result.published = true;
      notifications.push({
        id: ids.notification(),
        user_id: result.student_id,
        type: "result_published",
        title: "Result published",
        body: `Your result for "${result.exam.title}" is now available.`,
        read_at: null,
        created_at: nowIso(),
      });
      return ok(result, "Result published.");
    },
  },
  {
    method: "post",
    path: "/admin/results/:id/unpublish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const result = examResults.find((r) => r.id === Number(ctx.params.id));
      if (!result) return notFound("Result");
      result.published = false;
      return ok(result, "Result unpublished.");
    },
  },

  // --- Events ---
  {
    method: "get",
    path: "/admin/events",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const { items, meta } = paginate(events, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/events/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const event = events.find((e) => e.id === Number(ctx.params.id));
      if (!event) return notFound("Event");
      return ok(event);
    },
  },
  {
    method: "post",
    path: "/admin/events",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body;
      if (!b.title || !b.content) return validationError({ title: ["The title field is required."] });
      const event = {
        id: ids.event(),
        slug: slugify(String(b.title)),
        title: String(b.title),
        arabic_title: b.arabic_title as string | undefined,
        content: String(b.content),
        arabic_content: b.arabic_content as string | undefined,
        category: String(b.category ?? "Announcement"),
        featured_image_url: b.featured_image instanceof File ? URL.createObjectURL(b.featured_image) : undefined,
        is_published: false,
        event_date: (b.event_date as string) ?? null,
        published_at: nowIso(),
      };
      events.push(event);
      return ok(event, "Event created.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/events/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const event = events.find((e) => e.id === Number(ctx.params.id));
      if (!event) return notFound("Event");
      Object.assign(event, ctx.body);
      return ok(event, "Event updated.");
    },
  },
  {
    method: "delete",
    path: "/admin/events/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = events.findIndex((e) => e.id === Number(ctx.params.id));
      if (index === -1) return notFound("Event");
      events.splice(index, 1);
      return ok(null, "Event deleted.");
    },
  },
  {
    method: "post",
    path: "/admin/events/:id/publish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const event = events.find((e) => e.id === Number(ctx.params.id));
      if (!event) return notFound("Event");
      event.is_published = true;
      return ok(event, "Event published.");
    },
  },
  {
    method: "post",
    path: "/admin/events/:id/unpublish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const event = events.find((e) => e.id === Number(ctx.params.id));
      if (!event) return notFound("Event");
      event.is_published = false;
      return ok(event, "Event unpublished.");
    },
  },

  // --- Hajj & Umrah: packages ---
  {
    method: "get",
    path: "/admin/hajj-umrah/packages",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const { items, meta } = paginate(hajjUmrahPackages, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "post",
    path: "/admin/hajj-umrah/packages",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body;
      if (!b.title) return validationError({ title: ["The title field is required."] });
      const pkg = {
        id: Math.max(0, ...hajjUmrahPackages.map((p) => p.id)) + 1,
        slug: slugify(String(b.title)),
        type: (b.type as "hajj" | "umrah") ?? "umrah",
        title: String(b.title),
        arabic_title: b.arabic_title as string | undefined,
        description: String(b.description ?? ""),
        arabic_description: b.arabic_description as string | undefined,
        price: b.price ? Number(b.price) : undefined,
        currency: (b.currency as string) ?? "USD",
        duration_days: b.duration_days ? Number(b.duration_days) : undefined,
        is_published: false,
      };
      hajjUmrahPackages.push(pkg);
      return ok(pkg, "Package created.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/hajj-umrah/packages/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const pkg = hajjUmrahPackages.find((p) => p.id === Number(ctx.params.id));
      if (!pkg) return notFound("Package");
      Object.assign(pkg, ctx.body);
      return ok(pkg, "Package updated.");
    },
  },
  {
    method: "delete",
    path: "/admin/hajj-umrah/packages/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = hajjUmrahPackages.findIndex((p) => p.id === Number(ctx.params.id));
      if (index === -1) return notFound("Package");
      hajjUmrahPackages.splice(index, 1);
      return ok(null, "Package deleted.");
    },
  },
  {
    method: "post",
    path: "/admin/hajj-umrah/packages/:id/publish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const pkg = hajjUmrahPackages.find((p) => p.id === Number(ctx.params.id));
      if (!pkg) return notFound("Package");
      pkg.is_published = true;
      return ok(pkg, "Package published.");
    },
  },
  {
    method: "post",
    path: "/admin/hajj-umrah/packages/:id/unpublish",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const pkg = hajjUmrahPackages.find((p) => p.id === Number(ctx.params.id));
      if (!pkg) return notFound("Package");
      pkg.is_published = false;
      return ok(pkg, "Package unpublished.");
    },
  },

  // --- Hajj & Umrah: FAQs ---
  {
    method: "get",
    path: "/admin/hajj-umrah/faqs",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      return ok(hajjUmrahFaqs);
    },
  },
  {
    method: "post",
    path: "/admin/hajj-umrah/faqs",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body;
      if (!b.question || !b.answer) return validationError({ question: ["The question field is required."] });
      const faq = { id: Math.max(0, ...hajjUmrahFaqs.map((f) => f.id)) + 1, question: String(b.question), arabic_question: b.arabic_question as string | undefined, answer: String(b.answer), arabic_answer: b.arabic_answer as string | undefined };
      hajjUmrahFaqs.push(faq);
      return ok(faq, "FAQ created.", 201);
    },
  },
  {
    method: "put",
    path: "/admin/hajj-umrah/faqs/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const faq = hajjUmrahFaqs.find((f) => f.id === Number(ctx.params.id));
      if (!faq) return notFound("FAQ");
      Object.assign(faq, ctx.body);
      return ok(faq, "FAQ updated.");
    },
  },
  {
    method: "delete",
    path: "/admin/hajj-umrah/faqs/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = hajjUmrahFaqs.findIndex((f) => f.id === Number(ctx.params.id));
      if (index === -1) return notFound("FAQ");
      hajjUmrahFaqs.splice(index, 1);
      return ok(null, "FAQ deleted.");
    },
  },

  // --- Hajj & Umrah: announcements ---
  {
    method: "get",
    path: "/admin/hajj-umrah/announcements",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      return ok(hajjUmrahAnnouncements);
    },
  },
  {
    method: "post",
    path: "/admin/hajj-umrah/announcements",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body;
      if (!b.title || !b.body) return validationError({ title: ["The title field is required."] });
      const announcement = { id: Math.max(0, ...hajjUmrahAnnouncements.map((a) => a.id)) + 1, title: String(b.title), arabic_title: b.arabic_title as string | undefined, body: String(b.body), arabic_body: b.arabic_body as string | undefined, published_at: nowIso() };
      hajjUmrahAnnouncements.push(announcement);
      return ok(announcement, "Announcement created.", 201);
    },
  },
  {
    method: "delete",
    path: "/admin/hajj-umrah/announcements/:id",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const index = hajjUmrahAnnouncements.findIndex((a) => a.id === Number(ctx.params.id));
      if (index === -1) return notFound("Announcement");
      hajjUmrahAnnouncements.splice(index, 1);
      return ok(null, "Announcement deleted.");
    },
  },

  // --- Settings ---
  {
    method: "get",
    path: "/admin/settings",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      return ok(orgSettings);
    },
  },
  {
    method: "put",
    path: "/admin/settings",
    handler: (ctx: MockContext) => {
      const auth = requireAdmin(ctx);
      if (!auth.ok) return auth.error;
      const b = ctx.body as Record<string, unknown>;
      Object.assign(orgSettings, b);
      if (b.payment && typeof b.payment === "object") {
        Object.assign(orgSettings.payment, b.payment as Record<string, unknown>);
      }
      return ok(orgSettings, "Settings updated.");
    },
  },
];

