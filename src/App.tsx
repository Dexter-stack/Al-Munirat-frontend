import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { StudentLayout } from "@/layouts/StudentLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoute } from "@/routes/RoleRoute";
import { StudentActiveGuard } from "@/routes/StudentActiveGuard";
import { LoadingState } from "@/components/states/LoadingState";
import { NotFound } from "@/components/states/NotFound";

// Public
const Home = lazy(() => import("@/pages/public/Home"));
const About = lazy(() => import("@/pages/public/About"));
const CoursesList = lazy(() => import("@/pages/public/CoursesList"));
const CourseDetail = lazy(() => import("@/pages/public/CourseDetail"));
const EventsList = lazy(() => import("@/pages/public/EventsList"));
const EventDetail = lazy(() => import("@/pages/public/EventDetail"));
const HajjUmrah = lazy(() => import("@/pages/public/HajjUmrah"));
const Contact = lazy(() => import("@/pages/public/Contact"));

// Auth
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));

// Payment
const PaymentInstructions = lazy(() => import("@/pages/payment/PaymentInstructions"));
const PaymentStatus = lazy(() => import("@/pages/payment/PaymentStatus"));

// Student
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
const StudentCoursesList = lazy(() => import("@/pages/student/CoursesList"));
const StudentCourseDetail = lazy(() => import("@/pages/student/CourseDetail"));
const StudentMaterials = lazy(() => import("@/pages/student/Materials"));
const StudentAssignments = lazy(() => import("@/pages/student/Assignments"));
const StudentAssignmentDetail = lazy(() => import("@/pages/student/AssignmentDetail"));
const StudentExams = lazy(() => import("@/pages/student/Exams"));
const StudentExamDetail = lazy(() => import("@/pages/student/ExamDetail"));
const StudentExamTake = lazy(() => import("@/pages/student/ExamTake"));
const StudentResults = lazy(() => import("@/pages/student/Results"));
const StudentProgress = lazy(() => import("@/pages/student/Progress"));
const StudentNotifications = lazy(() => import("@/pages/student/Notifications"));
const StudentProfile = lazy(() => import("@/pages/student/Profile"));
const StudentSettings = lazy(() => import("@/pages/student/Settings"));

// Admin
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminStudents = lazy(() => import("@/pages/admin/Students"));
const AdminStudentDetail = lazy(() => import("@/pages/admin/StudentDetail"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
const AdminClasses = lazy(() => import("@/pages/admin/Classes"));
const AdminCourses = lazy(() => import("@/pages/admin/Courses"));
const AdminMaterials = lazy(() => import("@/pages/admin/Materials"));
const AdminAssignments = lazy(() => import("@/pages/admin/Assignments"));
const AdminExams = lazy(() => import("@/pages/admin/Exams"));
const AdminExamAttempts = lazy(() => import("@/pages/admin/ExamAttempts"));
const AdminQuestionBank = lazy(() => import("@/pages/admin/QuestionBank"));
const AdminResults = lazy(() => import("@/pages/admin/Results"));
const AdminEvents = lazy(() => import("@/pages/admin/Events"));
const AdminHajjUmrah = lazy(() => import("@/pages/admin/HajjUmrah"));
const AdminNotifications = lazy(() => import("@/pages/admin/Notifications"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingState />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<CoursesList />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/hajj-umrah" element={<HajjUmrah />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/payment" element={<PaymentInstructions />} />
            <Route path="/payment/status" element={<PaymentStatus />} />
          </Route>

          <Route element={<StudentActiveGuard />}>
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<StudentCoursesList />} />
              <Route path="/student/courses/:id" element={<StudentCourseDetail />} />
              <Route path="/student/materials" element={<StudentMaterials />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/assignments/:id" element={<StudentAssignmentDetail />} />
              <Route path="/student/exams" element={<StudentExams />} />
              <Route path="/student/exams/:id" element={<StudentExamDetail />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route path="/student/progress" element={<StudentProgress />} />
              <Route path="/student/notifications" element={<StudentNotifications />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/settings" element={<StudentSettings />} />
            </Route>
            {/* The exam-taking screen intentionally has no sidebar/topbar chrome
                so nothing distracts from the timer and questions. */}
            <Route path="/student/exams/:id/take" element={<StudentExamTake />} />
          </Route>

          <Route element={<RoleRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/classes" element={<AdminClasses />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/materials" element={<AdminMaterials />} />
              <Route path="/admin/assignments" element={<AdminAssignments />} />
              <Route path="/admin/exams" element={<AdminExams />} />
              <Route path="/admin/exams/:examId/attempts" element={<AdminExamAttempts />} />
              <Route path="/admin/question-bank" element={<AdminQuestionBank />} />
              <Route path="/admin/results" element={<AdminResults />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/hajj-umrah" element={<AdminHajjUmrah />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
