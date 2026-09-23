import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { QueryState } from "@/components/states/QueryState";
import { studentAssignmentsApi, studentCoursesApi, studentMaterialsApi } from "@/api/student";
import { MATERIAL_TYPE_ICON } from "@/lib/materialTypes";
import { SUBMISSION_STATUS_STYLES } from "@/lib/assignmentStatus";
import type { MaterialType, SubmissionStatus } from "@/types/academic";

const MATERIAL_TYPE_I18N_KEY: Record<MaterialType, string> = {
  pdf: "studentMaterials.typePdf",
  video: "studentMaterials.typeVideo",
  audio: "studentMaterials.typeAudio",
  document: "studentMaterials.typeDocument",
  image: "studentMaterials.typeImage",
  text: "studentMaterials.typeText",
};

const SUBMISSION_STATUS_I18N_KEY: Record<SubmissionStatus, string> = {
  not_started: "studentAssignments.statusNotStarted",
  submitted: "studentAssignments.statusSubmitted",
  late: "studentAssignments.statusLate",
  graded: "studentAssignments.statusGraded",
};

const LANGUAGE_I18N_KEY: Record<string, string> = {
  english: "studentExamDetail.languageEnglish",
  arabic: "studentExamDetail.languageArabic",
  both: "studentExamDetail.languageBoth",
};

export default function StudentCourseDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const courseQuery = useQuery({
    queryKey: ["student", "courses", courseId],
    queryFn: () => studentCoursesApi.get(courseId),
    enabled: Number.isFinite(courseId),
  });

  const materialsQuery = useQuery({
    queryKey: ["student", "materials", { course_id: courseId }],
    queryFn: () => studentMaterialsApi.list({ course_id: courseId, per_page: 6 }),
    enabled: Number.isFinite(courseId),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["student", "assignments", { course_id: courseId }],
    queryFn: () => studentAssignmentsApi.list({ course_id: courseId, per_page: 6 }),
    enabled: Number.isFinite(courseId),
  });

  if (courseQuery.isLoading) return <LoadingState />;
  if (courseQuery.error) return <ErrorState error={courseQuery.error} onRetry={() => courseQuery.refetch()} />;
  if (!courseQuery.data) return null;

  const course = courseQuery.data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        to="/student/courses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
      >
        <MaterialIcon name="arrow_back" className="text-base" />
        {t("studentCourseDetail.backToCourses")}
      </Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="relative h-44 overflow-hidden">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-sky-100">
              <MaterialIcon name="menu_book" className="text-5xl text-brand-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/10" />
          <div className="absolute inset-x-6 bottom-4 text-white">
            {course.class?.name && (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                {course.class.name}
              </span>
            )}
            <h1 className="mt-2 text-2xl font-bold">{course.name}</h1>
            {course.arabic_name && (
              <p dir="rtl" className="mt-1 font-arabic text-base font-semibold text-white/90">
                {course.arabic_name}
              </p>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            {course.teacher_name && (
              <span className="flex items-center gap-1.5">
                <MaterialIcon name="person" className="text-base text-brand-600" />
                {course.teacher_name}
              </span>
            )}
            {course.duration && (
              <span className="flex items-center gap-1.5">
                <MaterialIcon name="schedule" className="text-base text-brand-600" />
                {course.duration}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MaterialIcon name="translate" className="text-base text-brand-600" />
              {LANGUAGE_I18N_KEY[course.language] ? t(LANGUAGE_I18N_KEY[course.language]) : course.language}
            </span>
          </div>

          {course.description && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold text-slate-900">{t("studentCourseDetail.aboutCourse")}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{course.description}</p>
              {course.arabic_description && (
                <p dir="rtl" className="mt-2 font-arabic text-sm leading-relaxed text-slate-600">
                  {course.arabic_description}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="h-11 w-full rounded-2xl bg-slate-100 p-1">
          <TabsTrigger value="materials" className="rounded-xl text-xs font-semibold">
            {t("studentCourseDetail.tabMaterials")}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-xl text-xs font-semibold">
            {t("studentCourseDetail.tabAssignments")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-4">
          <QueryState
            isLoading={materialsQuery.isLoading}
            error={materialsQuery.error}
            data={materialsQuery.data}
            onRetry={() => materialsQuery.refetch()}
            isEmpty={(d) => d.items.length === 0}
            emptyProps={{ icon: "auto_stories", title: t("studentCourseDetail.emptyMaterialsTitle"), description: t("studentCourseDetail.emptyMaterialsDescription") }}
          >
            {(data) => (
              <div className="flex flex-col gap-3">
                {data.items.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <MaterialIcon name={MATERIAL_TYPE_ICON[m.type]} className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{m.title}</p>
                      <p className="text-xs capitalize text-slate-500">{t(MATERIAL_TYPE_I18N_KEY[m.type])}</p>
                    </div>
                  </div>
                ))}
                <Link
                  to={`/student/materials?course=${courseId}`}
                  className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-brand-700 hover:underline"
                >
                  {t("studentCourseDetail.viewAllMaterials")}
                  <MaterialIcon name="arrow_forward" className="text-base" />
                </Link>
              </div>
            )}
          </QueryState>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <QueryState
            isLoading={assignmentsQuery.isLoading}
            error={assignmentsQuery.error}
            data={assignmentsQuery.data}
            onRetry={() => assignmentsQuery.refetch()}
            isEmpty={(d) => d.items.length === 0}
            emptyProps={{ icon: "assignment", title: t("studentCourseDetail.emptyAssignmentsTitle"), description: t("studentCourseDetail.emptyAssignmentsDescription") }}
          >
            {(data) => (
              <div className="flex flex-col gap-3">
                {data.items.map((a) => {
                  const style = SUBMISSION_STATUS_STYLES[a.submission_status ?? "not_started"];
                  return (
                    <Link
                      key={a.id}
                      to={`/student/assignments/${a.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs transition-colors hover:border-brand-200 hover:bg-sky-50/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{a.title}</p>
                        <p className="text-xs text-slate-500">{t("studentCourseDetail.due", { date: a.due_date ? new Date(a.due_date).toLocaleDateString() : "—" })}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${style.badge}`}>
                        {t(SUBMISSION_STATUS_I18N_KEY[a.submission_status ?? "not_started"])}
                      </span>
                    </Link>
                  );
                })}
                <Link
                  to={`/student/assignments?course=${courseId}`}
                  className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-brand-700 hover:underline"
                >
                  {t("studentCourseDetail.viewAllAssignments")}
                  <MaterialIcon name="arrow_forward" className="text-base" />
                </Link>
              </div>
            )}
          </QueryState>
        </TabsContent>
      </Tabs>
    </div>
  );
}
