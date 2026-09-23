import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { StatCard } from "@/components/dashboard/StatCard";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { adminDashboardApi } from "@/api/admin/dashboard";

const CARDS: {
  key: keyof Awaited<ReturnType<typeof adminDashboardApi.stats>>;
  labelKey: string;
  icon: string;
  tone: "sky" | "emerald" | "amber" | "brand" | "rose";
  href: string;
}[] = [
  { key: "total_students", labelKey: "adminDashboard.statTotalStudents", icon: "groups", tone: "sky", href: "/admin/students" },
  { key: "active_students", labelKey: "adminDashboard.statActiveStudents", icon: "verified_user", tone: "emerald", href: "/admin/students" },
  { key: "pending_approvals", labelKey: "adminDashboard.statPendingApprovals", icon: "hourglass_top", tone: "amber", href: "/admin/students" },
  { key: "pending_payments", labelKey: "adminDashboard.statPendingPayments", icon: "receipt_long", tone: "rose", href: "/admin/payments" },
  { key: "courses_count", labelKey: "adminDashboard.statCourses", icon: "menu_book", tone: "sky", href: "/admin/courses" },
  { key: "upcoming_tests", labelKey: "adminDashboard.statUpcomingTests", icon: "quiz", tone: "brand", href: "/admin/exams" },
  { key: "assignments_count", labelKey: "adminDashboard.statAssignments", icon: "assignment", tone: "amber", href: "/admin/assignments" },
  { key: "published_results", labelKey: "adminDashboard.statPublishedResults", icon: "military_tech", tone: "emerald", href: "/admin/results" },
];

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const statsQuery = useQuery({ queryKey: ["admin", "dashboard", "stats"], queryFn: adminDashboardApi.stats });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("adminDashboard.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("adminDashboard.subtitle")}</p>
      </div>

      {statsQuery.isLoading && <LoadingState />}
      {statsQuery.error && <ErrorState error={statsQuery.error} onRetry={() => statsQuery.refetch()} />}

      {statsQuery.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <Link key={card.key} to={card.href}>
              <StatCard icon={card.icon} value={`${statsQuery.data[card.key]}`} label={t(card.labelKey)} tone={card.tone} />
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <QuickAction
          icon="receipt_long"
          title={t("adminDashboard.quickReviewPaymentsTitle")}
          desc={t("adminDashboard.quickReviewPaymentsDesc")}
          href="/admin/payments"
        />
        <QuickAction
          icon="groups"
          title={t("adminDashboard.quickManageStudentsTitle")}
          desc={t("adminDashboard.quickManageStudentsDesc")}
          href="/admin/students"
        />
        <QuickAction
          icon="quiz"
          title={t("adminDashboard.quickPublishResultsTitle")}
          desc={t("adminDashboard.quickPublishResultsDesc")}
          href="/admin/results"
        />
      </div>
    </div>
  );
}

function QuickAction({ icon, title, desc, href }: { icon: string; title: string; desc: string; href: string }) {
  const { t } = useTranslation();
  return (
    <Link
      to={href}
      className="group flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs transition-all hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <MaterialIcon name={icon} className="text-xl" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{desc}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:text-brand-700">
          {t("adminDashboard.open")}
          <MaterialIcon name="arrow_forward" className="text-sm" />
        </span>
      </div>
    </Link>
  );
}
