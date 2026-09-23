import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { Material, MaterialStatus, MaterialType } from "@/types/academic";

/** Matches Backend-Almunirah/API_DOCUMENTATION.md §9's store body exactly. */
export interface MaterialPayload {
  title: string;
  arabic_title?: string;
  description?: string;
  arabic_description?: string;
  type: MaterialType;
  course_id?: number | null;
  class_id?: number | null;
  status?: MaterialStatus;
  file?: File;
}

export const adminMaterialsApi = {
  list: (params?: ListParams) => unwrapPaginated<Material>(apiClient.get("/admin/materials", { params })),
  get: (id: number) => unwrap<Material>(apiClient.get(`/admin/materials/${id}`)),
  create: (payload: MaterialPayload, onUploadProgress?: (percent: number) => void) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value as string | Blob);
    });
    return unwrap<Material>(
      apiClient.post("/admin/materials", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (onUploadProgress && evt.total) onUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      }),
    );
  },
  // PHP does not populate file uploads on PUT — method-spoof via POST +
  // _method=PUT when replacing the file, per API_DOCUMENTATION.md §9.
  update: (id: number, payload: Partial<MaterialPayload>) => {
    if (payload.file instanceof File) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) form.append(key, value as string | Blob);
      });
      return unwrap<Material>(
        apiClient.post(`/admin/materials/${id}?_method=PUT`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      );
    }
    return unwrap<Material>(apiClient.put(`/admin/materials/${id}`, payload));
  },
  remove: (id: number) => apiClient.delete(`/admin/materials/${id}`),
  publish: (id: number) => unwrap<Material>(apiClient.post(`/admin/materials/${id}/publish`)),
  unpublish: (id: number) => unwrap<Material>(apiClient.post(`/admin/materials/${id}/unpublish`)),
};
