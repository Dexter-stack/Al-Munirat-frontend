import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Gates the student learning area (courses, materials, assignments, CBT,
 * results, dashboard) on account_status === "active", per
 * API_CONTRACT.md §6. Every other status is routed to /payment/status,
 * which renders the matching status page. This mirrors — never decides —
 * the backend's state machine.
 */
export function StudentActiveGuard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.account_status !== "active") {
    return <Navigate to="/payment/status" replace />;
  }

  return <Outlet />;
}
