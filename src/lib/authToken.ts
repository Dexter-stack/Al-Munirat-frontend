/**
 * Single persistence location for the Sanctum bearer token, per
 * API_CONTRACT.md §2. No other secrets are stored client-side.
 */
const TOKEN_KEY = "almunirah_auth_token";

let inMemoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  inMemoryToken = localStorage.getItem(TOKEN_KEY);
  return inMemoryToken;
}

export function setAuthToken(token: string): void {
  inMemoryToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  inMemoryToken = null;
  localStorage.removeItem(TOKEN_KEY);
}
