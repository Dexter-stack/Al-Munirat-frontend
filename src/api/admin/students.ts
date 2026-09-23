import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { User } from "@/types/auth";

export const adminStudentsApi = {
  list: (params?: ListParams) => unwrapPaginated<User>(apiClient.get("/admin/students", { params })),
  get: (id: number) => unwrap<User>(apiClient.get(`/admin/students/${id}`)),
  update: (id: number, payload: Partial<User>) => unwrap<User>(apiClient.put(`/admin/students/${id}`, payload)),
  approve: (id: number) => unwrap<User>(apiClient.post(`/admin/students/${id}/approve`)),
  suspend: (id: number, reason?: string) =>
    unwrap<User>(apiClient.post(`/admin/students/${id}/suspend`, { reason })),
};
