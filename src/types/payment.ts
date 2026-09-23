/**
 * Matches Backend-Almunirah/API_DOCUMENTATION.md §2-4 exactly (Phase 2).
 * Payment.status is distinct from the user's account_status — there is no
 * "receipt_submitted" at the Payment level, only at the account level.
 */
export type PaymentStatus = "pending" | "under_review" | "approved" | "rejected";

export interface PaymentInstructions {
  bank_name: string;
  account_name: string;
  account_number: string;
  /** Decimal cast on the backend — arrives as a string, e.g. "25000". */
  amount: string;
  currency: string;
  reference: string;
}

export interface PaymentReceipt {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface Payment {
  id: number;
  user_id: number;
  /** Decimal cast — arrives as a string, e.g. "25000.00". */
  amount: string;
  currency: string;
  reference: string;
  payment_method: string;
  payment_date: string;
  status: PaymentStatus;
  admin_notes?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  user?: { id: number; first_name: string; last_name: string; email: string };
  receipts: PaymentReceipt[];
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentPayload {
  amount: number;
  currency: string;
  reference: string;
  /** YYYY-MM-DD, not future. */
  payment_date: string;
  payment_method: string;
}

export interface UploadReceiptPayload {
  receipt: File;
  amount: number;
  payment_date: string;
  reference: string;
}
