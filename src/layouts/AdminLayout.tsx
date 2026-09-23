import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DashboardSidebar, type DashboardNavSection } from "@/components/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { useAuth } from "@/contexts/AuthContext";

export function AdminLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const sections: DashboardNavSection[] = [
    {
      heading: t("adminLayout.sectionOverview"),
      items: [{ to: "/admin", icon: "dashboard", label: t("adminLayout.navDashboard"), end: true }],
    },
    {
      heading: t("adminLayout.sectionAdmissions"),
      items: [
        { to: "/admin/students", icon: "groups", label: t("adminLayout.navStudents") },
        { to: "/admin/payments", icon: "receipt_long", label: t("adminLayout.navPayments") },
        { to: "/admin/classes", icon: "school", label: t("adminLayout.navClasses") },
      ],
    },
    {
      heading: t("adminLayout.sectionAcademics"),
      items: [
        { to: "/admin/courses", icon: "menu_book", label: t("adminLayout.navCourses") },
        { to: "/admin/materials", icon: "folder_open", label: t("adminLayout.navMaterials") },
        { to: "/admin/assignments", icon: "assignment", label: t("adminLayout.navAssignments") },
        { to: "/admin/exams", icon: "quiz", label: t("adminLayout.navExams") },
        { to: "/admin/question-bank", icon: "quiz", label: t("adminLayout.navQuestionBank") },
        { to: "/admin/results", icon: "military_tech", label: t("adminLayout.navResults") },
      ],
    },
    {
      heading: t("adminLayout.sectionContent"),
      items: [
        { to: "/admin/events", icon: "event", label: t("adminLayout.navEvents") },
        { to: "/admin/hajj-umrah", icon: "mosque", label: t("adminLayout.navHajjUmrah") },
      ],
    },
    {
      heading: t("adminLayout.sectionSystem"),
      items: [
        { to: "/admin/notifications", icon: "notifications", label: t("adminLayout.navNotifications") },
        { to: "/admin/settings", icon: "settings", label: t("adminLayout.navSettings") },
      ],
    },
  ];

  const sidebarProps = {
    sections,
    user,
    roleLabel: t("adminLayout.roleLabel"),
    badge: t("adminLayout.badge"),
    backHref: "/",
    backLabel: t("adminLayout.backLabel"),
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <DashboardSidebar {...sidebarProps} />
      <div className="flex min-h-screen flex-col lg:ps-72">
        <DashboardTopbar
          sections={sections}
          roleLabel={sidebarProps.roleLabel}
          badge={sidebarProps.badge}
          backHref={sidebarProps.backHref}
          backLabel={sidebarProps.backLabel}
          notificationsHref="/admin/notifications"
          profileHref="/admin/settings"
          searchPlaceholder={t("common.search")}
        />
        <main className="flex w-full flex-1 flex-col gap-6 px-4 pb-14 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
