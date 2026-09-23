import axios, { AxiosHeaders, type AxiosError } from "axios";
import { env } from "@/lib/env";
import { clearAuthToken, getAuthToken } from "@/lib/authToken";
import { installMocksIfEnabled } from "@/api/mocks";
import type { ApiMeta } from "@/types/api";

/**
 * Normalized shape every caller (React Query hooks, forms) works with,
 * regardless of which branch of API_CONTRACT.md §4 produced it.
 */
export class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }

  get isValidation() {
    return this.status === 422;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** Business-rule conflict (e.g. "already under review", "already enrolled") — show `message` inline, not a form error. */
  get isConflict() {
    return this.status === 409;
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
});

installMocksIfEnabled(apiClient);

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

/** Dispatched so AuthProvider (inside the router tree) can react to a 401. */
export const AUTH_LOGOUT_EVENT = "auth:logout";

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    if (!error.response) {
      return Promise.reject(new ApiClientError("Network error. Check your connection and try again.", 0));
    }

    const { status, data } = error.response;
    const message = data?.message ?? "Something went wrong. Please try again.";

    if (status === 401) {
      clearAuthToken();
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    }

    return Promise.reject(new ApiClientError(message, status, data?.errors));
  },
);

export function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  return promise.then((res) => res.data.data);
}

export interface Paginated<T> {
  items: T[];
  meta: ApiMeta;
}

export function unwrapPaginated<T>(
  promise: Promise<{ data: { data: T[]; meta: ApiMeta } }>,
): Promise<Paginated<T>> {
  return promise.then((res) => ({ items: res.data.data, meta: res.data.meta }));
}
