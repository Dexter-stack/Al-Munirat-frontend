import type { AxiosInstance } from "axios";
import { env } from "@/lib/env";
import { mockAdapter } from "@/api/mocks/adapter";

/**
 * API_CONTRACT.md §15 — while the live backend isn't reachable, run every
 * request through a typed mock layer instead of the network. Every
 * src/api/**\/*.ts module keeps calling apiClient.get/post/... exactly as
 * it would against the real API; only the transport changes.
 */
export function installMocksIfEnabled(client: AxiosInstance) {
  if (!env.useMocks) return;
  client.defaults.adapter = mockAdapter;
  console.info(
    "%c[mock mode]%c Running against the built-in mock API (VITE_USE_MOCKS=true). See README.md “Mock mode” for demo accounts.",
    "background:#0284c7;color:#fff;padding:1px 4px;border-radius:3px",
    "",
  );
}
