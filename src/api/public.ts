import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { ClassLevel, Course } from "@/types/academic";
import type {
  ContactInfo,
  EventItem,
  HajjUmrahAnnouncement,
  HajjUmrahFaq,
  HajjUmrahPackage,
  PublicHomePayload,
  PublicSettings,
} from "@/types/content";

/**
 * Endpoints under /public/*. Per Backend-Almunirah/API_DOCUMENTATION.md:
 * classes (§6), courses/settings/home/contact-info (§11, the public-content
 * batch) are live and match exactly. events and hajj-umrah/* are NOT built
 * yet — those calls are still served by the mock layer (src/api/mocks/)
 * until their backend phases land.
 */
export const publicApi = {
  courses: (params?: ListParams) => unwrapPaginated<Course>(apiClient.get("/public/courses", { params })),

  course: (slug: string) => unwrap<Course>(apiClient.get(`/public/courses/${slug}`)),

  /** `{ settings, featured_courses }` only — no events/hajj-umrah sections yet (§11, flagged by the backend). */
  home: () => unwrap<PublicHomePayload>(apiClient.get("/public/home")),

  /** Every key from the site settings store, `null` when unset — never partially missing. */
  settings: () => unwrap<PublicSettings>(apiClient.get("/public/settings")),

  /** Curated contact info (email/phone/address/social) to populate the Contact page. */
  contactInfo: () => unwrap<ContactInfo>(apiClient.get("/public/contact")),

  events: (params?: ListParams) => unwrapPaginated<EventItem>(apiClient.get("/public/events", { params })),

  event: (slug: string) => unwrap<EventItem>(apiClient.get(`/public/events/${slug}`)),

  hajjUmrahPackages: (type?: "hajj" | "umrah") =>
    unwrap<HajjUmrahPackage[]>(apiClient.get("/public/hajj-umrah/packages", { params: { type } })),

  hajjUmrahFaqs: () => unwrap<HajjUmrahFaq[]>(apiClient.get("/public/hajj-umrah/faqs")),

  hajjUmrahAnnouncements: () =>
    unwrap<HajjUmrahAnnouncement[]>(apiClient.get("/public/hajj-umrah/announcements")),

  /**
   * A lead-capture form submission — NOT the same as `contactInfo()` above
   * (that's GET /public/contact for display info; this is a POST). No real
   * backend endpoint exists for submitting this form yet, so it's still
   * mock-only. Reconcile once the backend adds one.
   */
  contact: (payload: { name: string; email: string; phone?: string; subject: string; message?: string }) =>
    apiClient.post("/public/contact", payload),

  /** Matches API_DOCUMENTATION.md §6 — only `status: active` classes, unauthenticated. */
  classLevels: () => unwrap<ClassLevel[]>(apiClient.get("/public/classes")),
};
