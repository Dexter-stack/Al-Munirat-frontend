import { apiClient, unwrap } from "@/api/client";
import type { PaymentInstructions } from "@/types/payment";

export interface OrganizationSettings {
  site_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  payment: PaymentInstructions;
}

export const adminSettingsApi = {
  get: () => unwrap<OrganizationSettings>(apiClient.get("/admin/settings")),
  update: (payload: Partial<OrganizationSettings>) =>
    unwrap<OrganizationSettings>(apiClient.put("/admin/settings", payload)),
};
