import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { StatCard } from "@/components/dashboard/StatCard";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { QueryState } from "@/components/states/QueryState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  studentCoursesApi,
  studentExamsApi,
  studentAssignmentsApi,
  studentResultsApi,
  notificationsApi,
} from "@/api/student";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const coursesQuery = useQuery({
    queryKey: ["student", "courses", { per_page: 3 }],
    queryFn: () => studentCoursesApi.list({ per_page: 3 }),
  });
  const examsQuery = useQuery({ queryKey: ["student", "exams"], queryFn: () => studentExamsApi.list() });
  const assignmentsQuery = useQuery({
    queryKey: ["student", "assignments", { per_page: 5 }],
    queryFn: () => studentAssignmentsApi.list({ per_page: 5 }),
  });
  const resultsQuery = useQuery({ queryKey: ["student", "results"], queryFn: studentResultsApi.list });
  const notificationsQuery = useQuery({
    queryKey: ["notifications", { per_page: 4 }],
    queryFn: () => notificationsApi.list({ per_page: 4 }),
  });

  const upcomingExams = (examsQuery.data?.items ?? []).filter((e) => e.availability !== "closed").slice(0, 3);
  const pendingAssignments = (assignmentsQuery.data?.items ?? [])
    .filter((a) => (a.submission_status ?? "not_started") === "not_started")
    .slice(0, 4);
  const recentResults = (resultsQuery.data ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 p-7 shadow-xs">
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-1/4 h-60 w-60 rounded-full bg-emerald-100/40 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-4 ring-sky-100">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
                  {user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}` : ""}
                </div>
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("studentDashboard.accountActive")}
              </span>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                {t("studentDashboard.greeting", { name: user?.first_name })}
              </h1>
              <p dir="rtl" className="mt-1 max-w-xl font-arabic text-sm font-semibold tracking-wide text-brand-800">
                مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الجَنَّةِ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <Button asChild variant="outline" className="rounded-xl border-slate-200/90 text-xs font-semibold text-slate-700">
              <Link to="/student/materials">
                <MaterialIcon name="auto_stories" className="text-base text-brand-600" />
                {t("studentDashboard.materialsCta")}
              </Link>
            </Button>
            <Button asChild className="rounded-xl text-xs font-semibold shadow-sm shadow-brand-500/30">
              <Link to="/student/exams">
                <MaterialIcon name="quiz" className="text-base" />
                {t("studentDashboard.examsCta")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 border-t border-sky-100/70 pt-6 md:grid-cols-4">
          <StatCard icon="menu_book" value={`${coursesQuery.data?.meta.total ?? 0}`} label={t("studentDashboard.statEnrolledCourses")} tone="sky" />
          <StatCard
            icon="timer"
            value={`${upcomingExams.length}`}
            label={t("studentDashboard.statUpcomingExams")}
            tone="brand"
            highlight={upcomingExams.length > 0}
          />
          <StatCard icon="assignment" value={`${pendingAssignments.length}`} label={t("studentDashboard.statPendingAssignments")} tone="amber" />
          <StatCard
            icon="workspace_premium"
            value={recentResults.length ? `${recentResults[0].percentage}%` : "—"}
            label={t("studentDashboard.statLatestResult")}
            tone="emerald"
          />
        </div>
      </section>

      {/* Enrolled courses */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentDashboard.enrolledCurriculum")}</span>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{t("studentDashboard.myCourses")}</h2>
          </div>
          <Link to="/student/courses" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline">
            {t("studentDashboard.viewAllCourses")}
            <MaterialIcon name="arrow_forward" className="text-base" />
          </Link>
        </div>

        <QueryState
          isLoading={coursesQuery.isLoading}
          error={coursesQuery.error}
          data={coursesQuery.data}
          onRetry={() => coursesQuery.refetch()}
          isEmpty={(d) => d.items.length === 0}
          emptyProps={{ icon: "menu_book", title: t("studentDashboard.emptyCoursesTitle"), description: t("studentDashboard.emptyCoursesDescription") }}
        >
          {(data) => (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {data.items.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </QueryState>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming exams */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t("studentDashboard.upcomingExamsTitle")}</h3>
            <Link to="/student/exams" className="text-xs font-semibold text-brand-600 hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          {examsQuery.isLoading && <Skeleton className="h-24 w-full" />}
          {!examsQuery.isLoading && upcomingExams.length === 0 && (
            <EmptyState icon="quiz" title={t("studentDashboard.noTestsScheduledTitle")} description={t("studentDashboard.noTestsScheduledDescription")} className="py-8" />
          )}
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <Link
                key={exam.id}
                to={`/student/exams/${exam.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-3.5 transition-colors hover:border-brand-200 hover:bg-sky-50/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MaterialIcon name="quiz" className="text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{exam.title}</p>
                    <p className="text-xs text-slate-500">{exam.duration_minutes} {t("studentExams.minutesSuffix")}</p>
                  </div>
                </div>
                <MaterialIcon name="chevron_right" className="text-slate-400" />
              </Link>
            ))}
          </div>
        </section>

        {/* Pending assignments */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t("studentDashboard.pendingAssignmentsTitle")}</h3>
            <Link to="/student/assignments" className="text-xs font-semibold text-brand-600 hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          {assignmentsQuery.isLoading && <Skeleton className="h-24 w-full" />}
          {!assignmentsQuery.isLoading && pendingAssignments.length === 0 && (
            <EmptyState icon="task_alt" title={t("studentDashboard.nothingPendingTitle")} description={t("studentDashboard.nothingPendingDescription")} className="py-8" />
          )}
          <div className="space-y-3">
            {pendingAssignments.map((a) => (
              <Link
                key={a.id}
                to={`/student/assignments/${a.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-3.5 transition-colors hover:border-amber-200 hover:bg-amber-50/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <MaterialIcon name="assignment" className="text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {t("studentDashboard.due", { date: a.due_date ? new Date(a.due_date).toLocaleDateString() : "—" })}
                    </p>
                  </div>
                </div>
                <MaterialIcon name="chevron_right" className="text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent results */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t("studentDashboard.recentResultsTitle")}</h3>
            <Link to="/student/results" className="text-xs font-semibold text-brand-600 hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          {resultsQuery.isLoading && <Skeleton className="h-24 w-full" />}
          {!resultsQuery.isLoading && recentResults.length === 0 && (
            <EmptyState icon="military_tech" title={t("studentDashboard.noResultsTitle")} className="py-8" />
          )}
          <div className="space-y-3">
            {recentResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.exam.title}</p>
                  <p className="text-xs text-slate-500">{r.course.title}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    r.passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {r.percentage}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t("studentDashboard.notificationsTitle")}</h3>
            <Link to="/student/notifications" className="text-xs font-semibold text-brand-600 hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          {notificationsQuery.isLoading && <Skeleton className="h-24 w-full" />}
          {!notificationsQuery.isLoading && (notificationsQuery.data?.items.length ?? 0) === 0 && (
            <EmptyState icon="notifications" title={t("studentNotifications.emptyTitle")} className="py-8" />
          )}
          <div className="space-y-3">
            {notificationsQuery.data?.items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                  <MaterialIcon name="notifications" className="text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
