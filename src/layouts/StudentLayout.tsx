import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DashboardSidebar, type DashboardNavSection } from "@/components/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { useAuth } from "@/contexts/AuthContext";

export function StudentLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const sections: DashboardNavSection[] = [
    {
      heading: t("studentLayout.academicHub"),
      items: [
        { to: "/student", icon: "dashboard", label: t("studentLayout.navDashboard"), end: true },
        { to: "/student/courses", icon: "menu_book", label: t("studentLayout.navMyCourses") },
        { to: "/student/materials", icon: "folder_open", label: t("studentLayout.navMaterials") },
        { to: "/student/assignments", icon: "assignment", label: t("studentLayout.navAssignments") },
        { to: "/student/exams", icon: "quiz", label: t("studentLayout.navExams") },
        { to: "/student/progress", icon: "insights", label: t("studentLayout.navProgress") },
        { to: "/student/results", icon: "military_tech", label: t("studentLayout.navResults") },
      ],
    },
    {
      heading: t("studentLayout.account"),
      items: [
        { to: "/student/notifications", icon: "notifications", label: t("studentLayout.navNotifications") },
        { to: "/student/profile", icon: "person", label: t("studentLayout.navProfile") },
        { to: "/student/settings", icon: "tune", label: t("studentLayout.navSettings") },
      ],
    },
  ];

  const sidebarProps = {
    sections,
    user,
    roleLabel: t("studentLayout.roleLabel"),
    badge: "Sanad LMS",
    backHref: "/",
    backLabel: t("studentLayout.backLabel"),
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
          notificationsHref="/student/notifications"
          profileHref="/student/profile"
          searchPlaceholder={t("common.search")}
        />
        <main className="flex w-full flex-1 flex-col gap-6 px-4 pb-14 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
