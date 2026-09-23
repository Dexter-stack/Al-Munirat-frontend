import type { ApiMeta } from "@/types/api";

/** A mock handler's return value — the adapter wraps this into a full AxiosResponse. */
export interface MockResult {
  status: number;
  data: unknown;
}

export function ok<T>(data: T, message = "OK", status = 200): MockResult {
  return { status, data: { success: true, message, data } };
}

export function okPaginated<T>(items: T[], meta: ApiMeta, message = "OK"): MockResult {
  return { status: 200, data: { success: true, message, data: items, meta } };
}

export function fail(status: number, message: string, errors?: Record<string, string[]>): MockResult {
  return { status, data: { success: false, message, errors } };
}

export function notFound(resource = "Resource"): MockResult {
  return fail(404, `${resource} not found.`);
}

export function unauthorized(message = "Unauthenticated."): MockResult {
  return fail(401, message);
}

export function forbidden(message = "You do not have permission to perform this action."): MockResult {
  return fail(403, message);
}

export function validationError(errors: Record<string, string[]>): MockResult {
  return fail(422, "Validation failed", errors);
}

/** Query-param driven pagination over an in-memory array, matching API_CONTRACT.md §5. */
export function paginate<T>(items: T[], query: Record<string, unknown>): { items: T[]; meta: ApiMeta } {
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(query.per_page) || 15));
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    meta: { current_page: page, per_page: perPage, total, last_page: lastPage },
  };
}
