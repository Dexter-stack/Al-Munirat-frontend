import { apiClient, unwrap } from "@/api/client";
import type {
  AuthResponseData,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from "@/types/auth";

export const authApi = {
  login: (payload: LoginPayload) =>
    unwrap<AuthResponseData>(apiClient.post("/auth/login", payload)),

  register: (payload: RegisterPayload) =>
    unwrap<AuthResponseData>(apiClient.post("/auth/register", payload)),

  logout: () => apiClient.post("/auth/logout"),

  me: () => unwrap<{ user: User }>(apiClient.get("/auth/me")).then((res) => res.user),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post("/auth/forgot-password", payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post("/auth/reset-password", payload),
};
