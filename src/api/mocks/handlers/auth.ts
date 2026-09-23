import type { MockContext } from "@/api/mocks/context";
import { currentUser, getBearerToken } from "@/api/mocks/context";
import { fail, ok, unauthorized, validationError } from "@/api/mocks/envelope";
import { createUser, findUserByEmail, issueToken } from "@/api/mocks/db";
import type { MockRoute } from "@/api/mocks/router";

export const authRoutes: MockRoute[] = [
  {
    method: "post",
    path: "/auth/register",
    handler: (ctx: MockContext) => {
      const b = ctx.body;
      const email = String(b.email ?? "");
      if (findUserByEmail(email)) {
        return validationError({ email: ["This email is already registered."] });
      }
      if (!b.password || b.password !== b.password_confirmation) {
        return validationError({ password_confirmation: ["The password confirmation does not match."] });
      }
      const requiredFields = ["first_name", "last_name", "email", "phone", "date_of_birth", "gender", "address", "class_id"];
      const missing = requiredFields.filter((f) => !b[f] && b[f] !== 0);
      if (missing.length) {
        const errors: Record<string, string[]> = {};
        missing.forEach((f) => (errors[f] = [`The ${f.replace(/_/g, " ")} field is required.`]));
        return validationError(errors);
      }
      const user = createUser({
        first_name: String(b.first_name),
        last_name: String(b.last_name),
        email,
        phone: String(b.phone),
        date_of_birth: String(b.date_of_birth),
        gender: b.gender as "male" | "female",
        address: String(b.address),
        class_id: Number(b.class_id),
      });
      return ok({ user, token: issueToken(user.id) }, "Registered successfully.", 201);
    },
  },
  {
    method: "post",
    path: "/auth/login",
    handler: (ctx: MockContext) => {
      const email = String(ctx.body.email ?? "");
      const password = String(ctx.body.password ?? "");
      const user = findUserByEmail(email);
      // Mock mode accepts any non-empty password for a known email — this
      // is a fixture layer, not a security boundary.
      if (!user || !password) {
        return validationError({ email: ["These credentials do not match our records."] });
      }
      return ok({ user, token: issueToken(user.id) }, "Logged in successfully.");
    },
  },
  {
    method: "post",
    path: "/auth/logout",
    handler: (ctx: MockContext) => {
      if (!getBearerToken(ctx.config)) return unauthorized();
      return ok(null, "Logged out.");
    },
  },
  {
    method: "get",
    path: "/auth/me",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      return ok({ user });
    },
  },
  {
    method: "post",
    path: "/auth/forgot-password",
    handler: () => {
      // Never confirm/deny whether an email exists.
      return ok(null, "If that email is registered, a reset link has been sent.");
    },
  },
  {
    method: "post",
    path: "/auth/reset-password",
    handler: (ctx: MockContext) => {
      if (!ctx.body.password || ctx.body.password !== ctx.body.password_confirmation) {
        return validationError({ password_confirmation: ["The password confirmation does not match."] });
      }
      if (!ctx.body.email || !ctx.body.token) {
        return fail(422, "This reset link is invalid or has expired.");
      }
      return ok(null, "Password has been reset.");
    },
  },
];
