import { apiClient, unwrap, unwrapPaginated } from "@/api/client";
import type { ListParams } from "@/types/api";
import type { Payment } from "@/types/payment";

export const adminPaymentsApi = {
  list: (params?: ListParams) => unwrapPaginated<Payment>(apiClient.get("/admin/payments", { params })),
  get: (id: number) => unwrap<Payment>(apiClient.get(`/admin/payments/${id}`)),
  approve: (id: number, adminNotes?: string) =>
    unwrap<Payment>(apiClient.post(`/admin/payments/${id}/approve`, adminNotes ? { admin_notes: adminNotes } : undefined)),
  reject: (id: number, reason: string) =>
    unwrap<Payment>(apiClient.post(`/admin/payments/${id}/reject`, { reason })),

  /** Private file — authenticated blob fetch, matching the student side. */
  downloadReceiptBlobUrl: async (paymentId: number) => {
    const res = await apiClient.get(`/admin/payments/${paymentId}/receipt/download`, { responseType: "blob" });
    return URL.createObjectURL(res.data as Blob);
  },
};
