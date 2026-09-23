import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { ClassLevel } from "@/types/academic";

export const adminClassesApi = {
  list: (params?: ListParams) => unwrapPaginated<ClassLevel>(apiClient.get("/admin/classes", { params })),
  get: (id: number) => unwrap<ClassLevel>(apiClient.get(`/admin/classes/${id}`)),
  create: (payload: Omit<ClassLevel, "id">) => unwrap<ClassLevel>(apiClient.post("/admin/classes", payload)),
  update: (id: number, payload: Partial<ClassLevel>) =>
    unwrap<ClassLevel>(apiClient.put(`/admin/classes/${id}`, payload)),
  remove: (id: number) => apiClient.delete(`/admin/classes/${id}`),
};
