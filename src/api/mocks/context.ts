import type { InternalAxiosRequestConfig } from "axios";
import type { User } from "@/types/auth";
import { userFromToken } from "@/api/mocks/db";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface MockContext {
  params: Record<string, string>;
  query: Record<string, unknown>;
  /** JSON body, or a plain object reconstructed from FormData (File values kept as File). */
  body: Record<string, unknown>;
  config: InternalAxiosRequestConfig;
}

function getHeader(config: InternalAxiosRequestConfig, name: string): string | undefined {
  const headers = config.headers as unknown;
  if (headers && typeof (headers as { get?: unknown }).get === "function") {
    const value = (headers as { get: (n: string) => unknown }).get(name);
    return typeof value === "string" ? value : undefined;
  }
  const plain = headers as Record<string, string> | undefined;
  return plain?.[name] ?? plain?.[name.toLowerCase()];
}

export function getBearerToken(config: InternalAxiosRequestConfig): string | null {
  const auth = getHeader(config, "Authorization");
  if (!auth) return null;
  const match = /^Bearer (.+)$/.exec(auth);
  return match ? match[1] : null;
}

export function currentUser(ctx: MockContext): User | null {
  return userFromToken(getBearerToken(ctx.config));
}

function formDataToObject(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [rawKey, value] of form.entries()) {
    // "attachments[]" (repeatable array fields, e.g. multi-file uploads) collect
    // into an array under the bare key; everything else keeps the last value.
    const isArrayKey = rawKey.endsWith("[]");
    const key = isArrayKey ? rawKey.slice(0, -2) : rawKey;
    if (isArrayKey) {
      const existing = obj[key];
      if (Array.isArray(existing)) existing.push(value);
      else obj[key] = [value];
    } else {
      obj[key] = value; // string | File — callers know which fields are files
    }
  }
  return obj;
}

export function parseBody(data: unknown): Record<string, unknown> {
  if (data == null) return {};
  if (typeof FormData !== "undefined" && data instanceof FormData) return formDataToObject(data);
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  if (typeof data === "object") return data as Record<string, unknown>;
  return {};
}
