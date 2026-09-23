import type { MockContext } from "@/api/mocks/context";
import { currentUser } from "@/api/mocks/context";
import { notFound, ok, okPaginated, paginate, unauthorized } from "@/api/mocks/envelope";
import { notifications } from "@/api/mocks/db";
import type { MockRoute } from "@/api/mocks/router";

// Bearer, any authenticated user (API_CONTRACT.md §13) — shared by student
// and admin notification pages alike.
export const notificationRoutes: MockRoute[] = [
  {
    method: "get",
    path: "/notifications",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      const mine = notifications
        .filter((n) => n.user_id === user.id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const { items, meta } = paginate(mine, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "post",
    path: "/notifications/:id/read",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      const notification = notifications.find((n) => n.id === Number(ctx.params.id) && n.user_id === user.id);
      if (!notification) return notFound("Notification");
      notification.read_at = new Date().toISOString();
      return ok(notification, "Marked as read.");
    },
  },
  {
    method: "post",
    path: "/notifications/read-all",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      const now = new Date().toISOString();
      notifications.filter((n) => n.user_id === user.id && !n.read_at).forEach((n) => (n.read_at = now));
      return ok(null, "All notifications marked as read.");
    },
  },
];
