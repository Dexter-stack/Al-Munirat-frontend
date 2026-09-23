import type { User } from "@/types/auth";

/** Where to send a user immediately after login/registration. */
export function accountStatusRedirect(user: User): string {
  if (user.role === "admin") return "/admin";
  return user.account_status === "active" ? "/student" : "/payment/status";
}
