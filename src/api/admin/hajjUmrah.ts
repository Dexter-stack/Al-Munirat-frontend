import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type {
  HajjUmrahAnnouncement,
  HajjUmrahFaq,
  HajjUmrahPackage,
} from "@/types/content";

export const adminHajjUmrahApi = {
  packages: {
    list: (params?: ListParams) =>
      unwrapPaginated<HajjUmrahPackage>(apiClient.get("/admin/hajj-umrah/packages", { params })),
    create: (payload: Omit<HajjUmrahPackage, "id" | "slug">) =>
      unwrap<HajjUmrahPackage>(apiClient.post("/admin/hajj-umrah/packages", payload)),
    update: (id: number, payload: Partial<HajjUmrahPackage>) =>
      unwrap<HajjUmrahPackage>(apiClient.put(`/admin/hajj-umrah/packages/${id}`, payload)),
    remove: (id: number) => apiClient.delete(`/admin/hajj-umrah/packages/${id}`),
    publish: (id: number) => unwrap<HajjUmrahPackage>(apiClient.post(`/admin/hajj-umrah/packages/${id}/publish`)),
    unpublish: (id: number) =>
      unwrap<HajjUmrahPackage>(apiClient.post(`/admin/hajj-umrah/packages/${id}/unpublish`)),
  },
  faqs: {
    list: () => unwrap<HajjUmrahFaq[]>(apiClient.get("/admin/hajj-umrah/faqs")),
    create: (payload: Omit<HajjUmrahFaq, "id">) => unwrap<HajjUmrahFaq>(apiClient.post("/admin/hajj-umrah/faqs", payload)),
    update: (id: number, payload: Partial<HajjUmrahFaq>) =>
      unwrap<HajjUmrahFaq>(apiClient.put(`/admin/hajj-umrah/faqs/${id}`, payload)),
    remove: (id: number) => apiClient.delete(`/admin/hajj-umrah/faqs/${id}`),
  },
  announcements: {
    list: () => unwrap<HajjUmrahAnnouncement[]>(apiClient.get("/admin/hajj-umrah/announcements")),
    create: (payload: Omit<HajjUmrahAnnouncement, "id" | "published_at">) =>
      unwrap<HajjUmrahAnnouncement>(apiClient.post("/admin/hajj-umrah/announcements", payload)),
    remove: (id: number) => apiClient.delete(`/admin/hajj-umrah/announcements/${id}`),
  },
};
