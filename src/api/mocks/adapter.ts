import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { parseBody } from "@/api/mocks/context";
import { fail } from "@/api/mocks/envelope";
import { findRoute } from "@/api/mocks/router";
import type { HttpMethod } from "@/api/mocks/context";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Small artificial delay so loading/skeleton states are visible, like a real network call. */
function simulatedLatency() {
  return 250 + Math.random() * 350;
}

/**
 * A drop-in Axios adapter (API_CONTRACT.md §15). Installed on `apiClient`
 * only when VITE_USE_MOCKS is true (see index.ts) — every src/api/**\/*.ts
 * module is completely unaware of it, so removing mock mode later is just
 * deleting this folder and flipping the env flag.
 */
export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? "get").toLowerCase() as HttpMethod;
  const [path, queryString] = (config.url ?? "").split("?");

  const query: Record<string, unknown> = { ...(config.params ?? {}) };
  if (queryString) {
    new URLSearchParams(queryString).forEach((value, key) => {
      query[key] = value;
    });
  }

  const match = findRoute(method, path);
  await wait(simulatedLatency());

  const request = { responseURL: config.url };
  let status: number;
  let data: unknown;

  if (!match) {
    console.warn(`[mock] No handler registered for ${method.toUpperCase()} ${path} — add one in src/api/mocks/handlers/.`);
    const result = fail(501, "This action isn't wired up in demo mode yet.");
    status = result.status;
    data = result.data;
  } else {
    const body = parseBody(config.data);
    const result = await match.route.handler({ params: match.params, query, body, config });
    status = result.status;
    data = result.data;
  }

  const response = {
    data,
    status,
    statusText: status < 300 ? "OK" : "Error",
    headers: {},
    config,
    request,
  };

  const validateStatus = config.validateStatus ?? ((s: number) => s >= 200 && s < 300);
  if (validateStatus(status)) {
    return response;
  }

  const message = (data as { message?: string } | undefined)?.message ?? "Request failed";
  throw new AxiosError(message, String(status), config, request, response);
};
