/**
 * Shapes mirror API_CONTRACT.md exactly. Every Laravel response uses this
 * envelope — never assume a bare payload.
 */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiPaginated<T> {
  success: true;
  message: string;
  data: T[];
  meta: ApiMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}
