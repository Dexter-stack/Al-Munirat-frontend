import type { MockContext } from "@/api/mocks/context";
import { currentUser } from "@/api/mocks/context";
import { fail, forbidden, notFound, ok, okPaginated, paginate, unauthorized, validationError } from "@/api/mocks/envelope";
import { ids, notifications, orgSettings, payments, users, nowIso } from "@/api/mocks/db";
import type { MockRoute } from "@/api/mocks/router";

// Matches Backend-Almunirah/API_DOCUMENTATION.md §2-4 exactly (Phase 2, live).
export const paymentRoutes: MockRoute[] = [
  {
    method: "get",
    path: "/payment/instructions",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      return ok({
        ...orgSettings.payment,
        reference: `ALM-${String(user.id).padStart(4, "0")}`,
      });
    },
  },
  {
    method: "post",
    path: "/student/payments",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      if (user.account_status === "active" || user.account_status === "suspended" || user.account_status === "under_review") {
        return fail(409, "You cannot declare a new payment in your current account state.");
      }
      const b = ctx.body;
      if (!b.amount || !b.payment_date || !b.reference || !b.payment_method) {
        return validationError({ amount: ["The amount field is required."] });
      }
      const payment = {
        id: ids.payment(),
        student_id: user.id,
        user_id: user.id,
        user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email },
        amount: String(b.amount),
        currency: String(b.currency ?? "USD"),
        reference: String(b.reference),
        payment_date: String(b.payment_date),
        payment_method: String(b.payment_method),
        status: "pending" as const,
        receipts: [],
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      payments.push(payment);

      const owner = users.find((u) => u.id === user.id);
      if (owner) owner.account_status = "receipt_submitted";

      return ok(payment, "Payment declared successfully.", 201);
    },
  },
  {
    method: "post",
    path: "/student/payments/:id/receipt",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      const payment = payments.find((p) => p.id === Number(ctx.params.id));
      if (!payment) return notFound("Payment");
      if (payment.student_id !== user.id) return forbidden();
      if (!ctx.body.receipt) {
        return validationError({ receipt: ["The receipt field must be a file of type: image/jpeg, image/png, application/pdf."] });
      }
      const file = ctx.body.receipt as File;

      payment.receipts.push({
        id: ids.receipt(),
        original_filename: file.name ?? "receipt",
        mime_type: file.type || "application/octet-stream",
        file_size: file.size ?? 0,
        uploaded_at: nowIso(),
      });
      payment.status = "under_review";
      payment.updated_at = nowIso();

      const owner = users.find((u) => u.id === user.id);
      if (owner) owner.account_status = "under_review";

      notifications.push({
        id: ids.notification(),
        user_id: 1,
        type: "payment_submitted",
        title: "New payment awaiting review",
        body: `${user.first_name} ${user.last_name} submitted a tuition receipt for review.`,
        read_at: null,
        created_at: nowIso(),
      });

      return ok(payment, "Receipt uploaded successfully.");
    },
  },
  {
    method: "get",
    path: "/student/payments",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      const mine = payments.filter((p) => p.student_id === user.id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return ok(mine);
    },
  },
  {
    method: "get",
    path: "/student/payments/:id",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      const payment = payments.find((p) => p.id === Number(ctx.params.id) && p.student_id === user.id);
      if (!payment) return notFound("Payment");
      return ok(payment);
    },
  },
  {
    method: "get",
    path: "/student/payments/:id/receipt/download",
    handler: (ctx: MockContext) => {
      const user = currentUser(ctx);
      if (!user) return unauthorized();
      const payment = payments.find((p) => p.id === Number(ctx.params.id));
      if (!payment) return notFound("Payment");
      if (payment.student_id !== user.id) return forbidden();
      const latest = payment.receipts[payment.receipts.length - 1];
      if (!latest) return notFound("Receipt");
      const text = `Mock receipt standing in for "${latest.original_filename}". Replace VITE_USE_MOCKS with a real backend to see the actual upload.`;
      return { status: 200, data: new Blob([text], { type: "text/plain" }) };
    },
  },

  // --- Admin ---
  {
    method: "get",
    path: "/admin/payments",
    handler: (ctx: MockContext) => {
      const admin = currentUser(ctx);
      if (!admin) return unauthorized();
      if (admin.role !== "admin") return forbidden();
      let list = [...payments].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const status = ctx.query.status as string | undefined;
      if (status) list = list.filter((p) => p.status === status);
      const search = ctx.query.search as string | undefined;
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((p) => `${p.user?.first_name ?? ""} ${p.user?.last_name ?? ""} ${p.user?.email ?? ""}`.toLowerCase().includes(q));
      }
      const { items, meta } = paginate(list, ctx.query);
      return okPaginated(items, meta);
    },
  },
  {
    method: "get",
    path: "/admin/payments/:id",
    handler: (ctx: MockContext) => {
      const admin = currentUser(ctx);
      if (!admin) return unauthorized();
      if (admin.role !== "admin") return forbidden();
      const payment = payments.find((p) => p.id === Number(ctx.params.id));
      if (!payment) return notFound("Payment");
      return ok(payment);
    },
  },
  {
    method: "get",
    path: "/admin/payments/:id/receipt/download",
    handler: (ctx: MockContext) => {
      const admin = currentUser(ctx);
      if (!admin) return unauthorized();
      if (admin.role !== "admin") return forbidden();
      const payment = payments.find((p) => p.id === Number(ctx.params.id));
      if (!payment) return notFound("Payment");
      const latest = payment.receipts[payment.receipts.length - 1];
      if (!latest) return notFound("Receipt");
      const text = `Mock receipt standing in for "${latest.original_filename}". Replace VITE_USE_MOCKS with a real backend to see the actual upload.`;
      return { status: 200, data: new Blob([text], { type: "text/plain" }) };
    },
  },
  {
    method: "post",
    path: "/admin/payments/:id/approve",
    handler: (ctx: MockContext) => {
      const admin = currentUser(ctx);
      if (!admin) return unauthorized();
      if (admin.role !== "admin") return forbidden();
      const payment = payments.find((p) => p.id === Number(ctx.params.id));
      if (!payment) return notFound("Payment");

      payment.status = "approved";
      payment.approved_by = admin.id;
      payment.approved_at = nowIso();
      payment.updated_at = nowIso();
      if (ctx.body.admin_notes) payment.admin_notes = String(ctx.body.admin_notes);

      const student = users.find((u) => u.id === payment.student_id);
      if (student) {
        student.account_status = "active";
        student.rejection_reason = null;
      }
      notifications.push({
        id: ids.notification(),
        user_id: payment.student_id,
        type: "payment_approved",
        title: "Payment approved",
        body: "Your tuition payment was verified and your account is now active.",
        read_at: null,
        created_at: nowIso(),
      });
      return ok(payment, "Payment approved successfully.");
    },
  },
  {
    method: "post",
    path: "/admin/payments/:id/reject",
    handler: (ctx: MockContext) => {
      const admin = currentUser(ctx);
      if (!admin) return unauthorized();
      if (admin.role !== "admin") return forbidden();
      const payment = payments.find((p) => p.id === Number(ctx.params.id));
      if (!payment) return notFound("Payment");
      const reason = String(ctx.body.reason ?? "");
      if (!reason) return validationError({ reason: ["The reason field is required."] });

      payment.status = "rejected";
      payment.admin_notes = reason;
      payment.rejected_at = nowIso();
      payment.updated_at = nowIso();
      const student = users.find((u) => u.id === payment.student_id);
      if (student) {
        student.account_status = "payment_rejected";
        student.rejection_reason = reason;
      }
      notifications.push({
        id: ids.notification(),
        user_id: payment.student_id,
        type: "payment_rejected",
        title: "Payment rejected",
        body: `Your tuition payment could not be verified: ${reason}`,
        read_at: null,
        created_at: nowIso(),
      });
      return ok(payment, "Payment rejected successfully.");
    },
  },
];
