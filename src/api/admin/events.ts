import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { EventItem } from "@/types/content";

export interface EventPayload {
  title: string;
  arabic_title?: string;
  content: string;
  arabic_content?: string;
  category: string;
  event_date?: string;
  featured_image?: File;
}

export const adminEventsApi = {
  list: (params?: ListParams) => unwrapPaginated<EventItem>(apiClient.get("/admin/events", { params })),
  get: (id: number) => unwrap<EventItem>(apiClient.get(`/admin/events/${id}`)),
  create: (payload: EventPayload) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) form.append(key, value as string | Blob);
    });
    return unwrap<EventItem>(
      apiClient.post("/admin/events", form, { headers: { "Content-Type": "multipart/form-data" } }),
    );
  },
  update: (id: number, payload: Partial<EventPayload>) =>
    unwrap<EventItem>(apiClient.put(`/admin/events/${id}`, payload)),
  remove: (id: number) => apiClient.delete(`/admin/events/${id}`),
  publish: (id: number) => unwrap<EventItem>(apiClient.post(`/admin/events/${id}/publish`)),
  unpublish: (id: number) => unwrap<EventItem>(apiClient.post(`/admin/events/${id}/unpublish`)),
};
