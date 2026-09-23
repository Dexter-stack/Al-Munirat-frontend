const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

if (!apiBaseUrl && !useMocks) {
  // Fail loudly in development so a missing .env is never mistaken for a
  // working backend connection.
  console.error(
    "VITE_API_BASE_URL is not set. Copy .env.example to .env.development (or configure it in your hosting provider) before running the app.",
  );
}

export const env = {
  apiBaseUrl: apiBaseUrl ?? "",
  /**
   * API_CONTRACT.md §15: while the live backend isn't reachable, the app
   * runs against a typed mock layer installed on the same Axios client
   * (src/api/mocks/) instead of hitting the network. Toggle via
   * VITE_USE_MOCKS in .env.development — never enable in production.
   */
  useMocks,
};

if (useMocks && import.meta.env.PROD) {
  console.warn(
    "VITE_USE_MOCKS is enabled in a production build. This should never ship — mocked data will be served instead of the real API.",
  );
}
