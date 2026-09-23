import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { ContentLanguage, Course, CourseStatus, Enrollment } from "@/types/academic";

/** Matches Backend-Almunirah/API_DOCUMENTATION.md §7's store/update body exactly. */
export interface CoursePayload {
  name: string;
  arabic_name?: string;
  slug?: string;
  description?: string;
  arabic_description?: string;
  class_id?: number | null;
  language: ContentLanguage;
  status?: CourseStatus;
  /** Free-text, e.g. "8 weeks" — no fixed unit on the backend. */
  duration?: string;
  teacher_name?: string;
  thumbnail?: File;
}

function toFormData(payload: CoursePayload) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, value as string | Blob);
  });
  return form;
}

export const adminCoursesApi = {
  list: (params?: ListParams) => unwrapPaginated<Course>(apiClient.get("/admin/courses", { params })),
  get: (id: number) => unwrap<Course>(apiClient.get(`/admin/courses/${id}`)),
  create: (payload: CoursePayload) =>
    unwrap<Course>(
      apiClient.post("/admin/courses", toFormData(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ),
  // PHP does not populate file uploads on PUT/PATCH — method-spoof via POST
  // + _method=PUT, per API_DOCUMENTATION.md §7.
  update: (id: number, payload: Partial<CoursePayload>) =>
    unwrap<Course>(
      apiClient.post(`/admin/courses/${id}?_method=PUT`, toFormData(payload as CoursePayload), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ),
  remove: (id: number) => apiClient.delete(`/admin/courses/${id}`),
  publish: (id: number) => adminCoursesApi.update(id, { status: "published" }),
  unpublish: (id: number) => adminCoursesApi.update(id, { status: "draft" }),

  enrollments: {
    list: (courseId: number) => unwrap<Enrollment[]>(apiClient.get(`/admin/courses/${courseId}/enrollments`)),
    enroll: (courseId: number, userId: number) =>
      unwrap<Enrollment>(apiClient.post(`/admin/courses/${courseId}/enrollments`, { user_id: userId })),
    unenroll: (courseId: number, enrollmentId: number) =>
      apiClient.delete(`/admin/courses/${courseId}/enrollments/${enrollmentId}`),
  },
};
