export type AccountStatus =
  | "pending_payment"
  | "receipt_submitted"
  | "under_review"
  | "payment_rejected"
  | "active"
  | "suspended";

export type UserRole = "student" | "admin";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  account_status: AccountStatus;
  date_of_birth?: string;
  gender?: "male" | "female";
  address?: string;
  class_id?: number;
  avatar_url?: string;
  rejection_reason?: string | null;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  date_of_birth: string;
  gender: "male" | "female";
  address: string;
  class_id: number;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}
