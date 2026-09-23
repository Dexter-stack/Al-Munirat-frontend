import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";
import { PermissionDenied } from "@/components/states/PermissionDenied";

/**
 * Route guard for role-restricted areas (e.g. /admin/*). This is UX only —
 * the backend enforces authorization via policies/middleware regardless
 * (API_CONTRACT.md §14).
 */
export function RoleRoute({ role }: { role: UserRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <PermissionDenied homeHref="/" />;

  return <Outlet />;
}
