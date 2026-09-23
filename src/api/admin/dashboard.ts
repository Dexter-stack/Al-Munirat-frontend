import { apiClient, unwrap } from "@/api/client";

export interface AdminDashboardStats {
  total_students: number;
  active_students: number;
  pending_approvals: number;
  pending_payments: number;
  courses_count: number;
  upcoming_tests: number;
  assignments_count: number;
  published_results: number;
}

export const adminDashboardApi = {
  stats: () => unwrap<AdminDashboardStats>(apiClient.get("/admin/dashboard/stats")),
};
