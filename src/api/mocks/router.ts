import type { MockContext, HttpMethod } from "@/api/mocks/context";
import type { MockResult } from "@/api/mocks/envelope";
import { compilePath, matchPath } from "@/api/mocks/path";
import { authRoutes } from "@/api/mocks/handlers/auth";
import { publicRoutes } from "@/api/mocks/handlers/public";
import { paymentRoutes } from "@/api/mocks/handlers/payment";
import { studentRoutes } from "@/api/mocks/handlers/student";
import { notificationRoutes } from "@/api/mocks/handlers/notifications";
import { adminRoutes } from "@/api/mocks/handlers/admin";

export interface MockRoute {
  method: HttpMethod;
  path: string;
  handler: (ctx: MockContext) => MockResult | Promise<MockResult>;
}

const allRoutes = [
  ...authRoutes,
  ...publicRoutes,
  ...paymentRoutes,
  ...studentRoutes,
  ...notificationRoutes,
  ...adminRoutes,
].map((route) => ({ ...route, compiled: compilePath(route.path) }));

export function findRoute(method: HttpMethod, url: string) {
  for (const route of allRoutes) {
    if (route.method !== method) continue;
    const params = matchPath(route.compiled, url);
    if (params) return { route, params };
  }
  return null;
}
