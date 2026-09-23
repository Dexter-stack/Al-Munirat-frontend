/**
 * In-memory mock "database" for API_CONTRACT.md §15. Seeded once at module
 * load, mutated in place by handlers (create/update/approve/publish/...),
 * reset on a full page reload. This is intentionally the ONLY place mock
 * data lives — handlers read/write through the helpers below, never
 * hard-code fixtures inline, so removing mock mode later is a matter of
 * deleting this folder and flipping VITE_USE_MOCKS off.
 *
 * Course/Material/Payment/ClassLevel shapes below are reconciled against
 * Backend-Almunirah/API_DOCUMENTATION.md (Phases 1-4, confirmed live).
 * Assignment/Exam/Result/Notification/Event/HajjUmrah shapes remain
 * forward guesses — those backend phases don't exist yet.
 */
import type { ClassLevel, Course, Material, Assignment, AssignmentSubmission, SubmissionStatus } from "@/types/academic";
import type { User } from "@/types/auth";
import type { Payment } from "@/types/payment";
import type { Exam, ExamAttempt, ExamAvailability, ExamQuestionAdmin } from "@/types/exam";
import type { ExamResult } from "@/types/result";
import type { AppNotification } from "@/types/notification";
import type { EventItem, HajjUmrahAnnouncement, HajjUmrahFaq, HajjUmrahPackage, PublicSettings } from "@/types/content";
import type { OrganizationSettings } from "@/api/admin/settings";

const now = () => new Date().toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export const classLevels: ClassLevel[] = [
  { id: 1, name: "Beginner Tajweed & Qur'an", arabic_name: "التجويد للمبتدئين", description: "Foundational Qur'an reading and Tajweed rules.", status: "active" },
  { id: 2, name: "Intermediate Classical Arabic", arabic_name: "العربية المتوسطة", description: "Nahw & Sarf for students who can already read Qur'an fluently.", status: "active" },
  { id: 3, name: "Fiqh Foundations Diploma", arabic_name: "أساسيات الفقه", description: "Core jurisprudence for daily worship and conduct.", status: "active" },
  { id: 4, name: "Youth Weekend Madrasah", arabic_name: "مدرسة نهاية الأسبوع", description: "Ages 8-15, Saturday/Sunday cohort.", status: "active" },
];

// ---------------------------------------------------------------------------
// Users. Login/register accept ANY password for a seeded or newly
// registered email — this is a mock, not a security boundary. See
// handlers/auth.ts.
// ---------------------------------------------------------------------------

export const users: User[] = [
  {
    id: 1,
    first_name: "Admin",
    last_name: "Registry",
    email: "admin@almunirat.org",
    phone: "+44 7700 900001",
    role: "admin",
    account_status: "active",
    created_at: daysFromNow(-400),
  },
  {
    id: 2,
    first_name: "Aisha",
    last_name: "Ibrahim",
    email: "student@almunirat.org",
    phone: "+44 7700 900002",
    role: "student",
    account_status: "active",
    date_of_birth: "2001-04-12",
    gender: "female",
    address: "14 Crescent Road, Birmingham, UK",
    class_id: 1,
    created_at: daysFromNow(-120),
  },
  {
    id: 3,
    first_name: "Fatima",
    last_name: "Noor",
    email: "fatima@almunirat.org",
    phone: "+44 7700 900003",
    role: "student",
    account_status: "under_review",
    date_of_birth: "1998-09-03",
    gender: "female",
    address: "22 Palm Street, Manchester, UK",
    class_id: 2,
    created_at: daysFromNow(-5),
  },
  {
    id: 4,
    first_name: "Zayd",
    last_name: "Rahman",
    email: "zayd@almunirat.org",
    phone: "+44 7700 900004",
    role: "student",
    account_status: "payment_rejected",
    date_of_birth: "2003-01-20",
    gender: "male",
    address: "7 Elm Court, Leeds, UK",
    class_id: 1,
    rejection_reason: "The receipt amount does not match the published tuition fee for your class level.",
    created_at: daysFromNow(-8),
  },
  {
    id: 5,
    first_name: "Yusuf",
    last_name: "Hassan",
    email: "yusuf@almunirat.org",
    phone: "+44 7700 900005",
    role: "student",
    account_status: "under_review",
    date_of_birth: "2000-06-15",
    gender: "male",
    address: "3 Oak Avenue, London, UK",
    class_id: 3,
    created_at: daysFromNow(-2),
  },
  {
    id: 6,
    first_name: "Khadija",
    last_name: "Ali",
    email: "khadija@almunirat.org",
    phone: "+44 7700 900006",
    role: "student",
    account_status: "active",
    date_of_birth: "1999-11-30",
    gender: "female",
    address: "9 Rose Lane, Cardiff, UK",
    class_id: 2,
    created_at: daysFromNow(-200),
  },
  {
    id: 7,
    first_name: "Omar",
    last_name: "Farouk",
    email: "omar@almunirat.org",
    phone: "+44 7700 900007",
    role: "student",
    account_status: "pending_payment",
    date_of_birth: "2004-02-18",
    gender: "male",
    address: "18 Cedar Way, Bristol, UK",
    class_id: 4,
    created_at: daysFromNow(-1),
  },
  {
    id: 8,
    first_name: "Layla",
    last_name: "Ahmed",
    email: "layla@almunirat.org",
    phone: "+44 7700 900008",
    role: "student",
    account_status: "suspended",
    date_of_birth: "2002-07-09",
    gender: "female",
    address: "5 Birch Grove, Glasgow, UK",
    class_id: 1,
    rejection_reason: null,
    created_at: daysFromNow(-260),
  },
];

let nextUserId = 9;

// ---------------------------------------------------------------------------
// Courses / materials / assignments
// ---------------------------------------------------------------------------

export const courses: Course[] = [
  {
    id: 1,
    slug: "quran-tajweed",
    name: "Qur'an Memorization & Tajweed",
    arabic_name: "تحفيظ القرآن والتجويد",
    description: "Systematic Hifz with oral-chain Tajweed correction, from Noorani Qaida through Juz 'Amma and beyond.",
    arabic_description: "برنامج تحفيظ منهجي مع تصحيح التجويد عبر السند الشفهي.",
    class_id: 1,
    class: classLevels[0],
    language: "arabic",
    status: "published",
    duration: "24 weeks",
    thumbnail_url: undefined,
    teacher_name: "Ustadh Yusuf Abdullah",
    created_at: daysFromNow(-300),
    updated_at: daysFromNow(-300),
  },
  {
    id: 2,
    slug: "classical-arabic-1",
    name: "Classical Arabic Grammar I",
    arabic_name: "النحو والصرف الأول",
    description: "Nahw & Sarf foundations for reading classical texts without relying on translation.",
    arabic_description: "أساسيات النحو والصرف لقراءة النصوص الكلاسيكية.",
    class_id: 2,
    class: classLevels[1],
    language: "both",
    status: "published",
    duration: "18 weeks",
    teacher_name: "Ustadha Maryam Khalil",
    created_at: daysFromNow(-260),
    updated_at: daysFromNow(-260),
  },
  {
    id: 3,
    slug: "fiqh-foundations",
    name: "Fiqh Foundations",
    arabic_name: "أساسيات الفقه",
    description: "Core jurisprudence of purification, prayer, and daily conduct from the mainstream schools.",
    class_id: 3,
    class: classLevels[2],
    language: "english",
    status: "published",
    duration: "16 weeks",
    teacher_name: "Sheikh Ibrahim Al-Sayed",
    created_at: daysFromNow(-220),
    updated_at: daysFromNow(-220),
  },
  {
    id: 4,
    slug: "aqeedah-hadith",
    name: "Aqeedah & 40 Hadith",
    arabic_name: "العقيدة والأربعون حديثا",
    description: "Foundational creed alongside a close reading of An-Nawawi's Forty Hadith.",
    class_id: 3,
    class: classLevels[2],
    language: "both",
    status: "published",
    duration: "12 weeks",
    teacher_name: "Sheikh Ibrahim Al-Sayed",
    created_at: daysFromNow(-180),
    updated_at: daysFromNow(-180),
  },
  {
    id: 5,
    slug: "youth-madrasah",
    name: "Youth Weekend Madrasah",
    arabic_name: "مدرسة نهاية الأسبوع للناشئة",
    description: "A gentle, activity-based Saturday/Sunday programme for ages 8-15.",
    class_id: 4,
    class: classLevels[3],
    language: "english",
    status: "published",
    duration: "20 weeks",
    teacher_name: "Ustadha Maryam Khalil",
    created_at: daysFromNow(-150),
    updated_at: daysFromNow(-150),
  },
  {
    id: 6,
    slug: "advanced-qiraat",
    name: "Advanced Qira'at",
    arabic_name: "القراءات المتقدمة",
    description: "The Ten Qira'at for advanced Huffaz seeking an Ijazah.",
    class_id: 1,
    class: classLevels[0],
    language: "arabic",
    status: "published",
    duration: "30 weeks",
    teacher_name: "Ustadh Yusuf Abdullah",
    created_at: daysFromNow(-90),
    updated_at: daysFromNow(-90),
  },
];
let nextCourseId = 7;

export const materials: Material[] = [
  { id: 1, course_id: 1, class_id: null, title: "Tajweed Rules Booklet", arabic_title: "كتيب أحكام التجويد", type: "pdf", original_filename: "tajweed-rules.pdf", mime_type: "application/pdf", file_size: 2_400_000, status: "published", published_at: daysFromNow(-90), created_at: daysFromNow(-90), updated_at: daysFromNow(-90) },
  { id: 2, course_id: 1, class_id: null, title: "Makharij al-Huruf Audio Guide", type: "audio", original_filename: "makharij-guide.mp3", mime_type: "audio/mpeg", file_size: 18_500_000, status: "published", published_at: daysFromNow(-75), created_at: daysFromNow(-75), updated_at: daysFromNow(-75) },
  { id: 3, course_id: 2, class_id: null, title: "Nahw — Chapter 1 Notes", type: "text", original_filename: "nahw-ch1-notes.txt", mime_type: "text/plain", file_size: 4_200, status: "published", published_at: daysFromNow(-60), created_at: daysFromNow(-60), updated_at: daysFromNow(-60) },
  { id: 4, course_id: 2, class_id: null, title: "Sarf Conjugation Walkthrough", type: "video", original_filename: "sarf-conjugation.mp4", mime_type: "video/mp4", file_size: 210_000_000, status: "published", published_at: daysFromNow(-40), created_at: daysFromNow(-40), updated_at: daysFromNow(-40) },
  { id: 5, course_id: 3, class_id: null, title: "Fiqh of Salah Handbook", type: "pdf", original_filename: "fiqh-salah-handbook.pdf", mime_type: "application/pdf", file_size: 1_800_000, status: "published", published_at: daysFromNow(-100), created_at: daysFromNow(-100), updated_at: daysFromNow(-100) },
  { id: 6, course_id: 3, class_id: null, title: "Wudhu Step-by-Step Diagram", type: "image", original_filename: "wudhu-steps.png", mime_type: "image/png", file_size: 640_000, status: "published", published_at: daysFromNow(-95), created_at: daysFromNow(-95), updated_at: daysFromNow(-95) },
];
let nextMaterialId = 7;

// Matches Backend-Almunirah/API_DOCUMENTATION.md §10 exactly (Phase 5,
// live). `status` here is the assignment's own lifecycle (draft/published/
// closed) — per-student submission_status/submission are computed by the
// student handler from `assignmentSubmissions` below, never stored here
// (the real admin CRUD response never includes them either).
export const assignments: Assignment[] = [
  { id: 1, course_id: 1, class_id: null, title: "Tajweed Recitation Recording", description: "Record yourself reciting Surah Al-Mulk verses 1-10 applying the Idghaam and Ikhfaa rules covered this week.", due_date: daysFromNow(3), maximum_score: "20.00", status: "published", attachments: [], created_at: daysFromNow(-10), updated_at: daysFromNow(-10) },
  { id: 2, course_id: 2, class_id: null, title: "Grammar Worksheet 1", description: "Complete the i'rab exercises on handout 1.", due_date: daysFromNow(1), maximum_score: "15.00", status: "published", attachments: [], created_at: daysFromNow(-8), updated_at: daysFromNow(-8) },
  { id: 3, course_id: 3, class_id: null, title: "Fiqh of Purification Essay", description: "Write a 500-word summary of the conditions that nullify wudhu.", due_date: daysFromNow(-3), maximum_score: "25.00", status: "published", attachments: [], created_at: daysFromNow(-20), updated_at: daysFromNow(-20) },
  { id: 4, course_id: 1, class_id: null, title: "Memorization Check — Juz 30", description: "Recite Juz 30 from memory to your Halaqah leader and upload the audio.", due_date: daysFromNow(-10), maximum_score: "20.00", status: "published", attachments: [], created_at: daysFromNow(-30), updated_at: daysFromNow(-30) },
  { id: 5, course_id: 2, class_id: null, title: "Vocabulary Quiz Submission", description: "Upload your completed vocabulary quiz sheet.", due_date: daysFromNow(-15), maximum_score: "10.00", status: "published", attachments: [], created_at: daysFromNow(-35), updated_at: daysFromNow(-35) },
];
let nextAssignmentId = 6;
let nextAttachmentId = 1;

export const assignmentSubmissions: (AssignmentSubmission & { assignment_id: number; student_id: number })[] = [
  {
    id: 1001, assignment_id: 3, student_id: 2, user_id: 2, user: userSummary(2),
    status: "submitted", score: null, feedback: null, submitted_at: daysFromNow(-4), graded_by: null, graded_at: null,
    attachments: [{ id: 101, original_filename: "purification-essay.pdf", mime_type: "application/pdf", file_size: 41_200, uploaded_at: daysFromNow(-4) }],
  },
  {
    id: 1002, assignment_id: 4, student_id: 2, user_id: 2, user: userSummary(2),
    status: "graded", score: 18, feedback: "Excellent Tajweed application, minor pacing issue on Surah An-Naba. Keep it up!", submitted_at: daysFromNow(-11), graded_by: 1, graded_at: daysFromNow(-10),
    attachments: [{ id: 102, original_filename: "recitation-juz30.mp3", mime_type: "audio/mpeg", file_size: 5_400_000, uploaded_at: daysFromNow(-11) }],
  },
  {
    id: 1003, assignment_id: 5, student_id: 2, user_id: 2, user: userSummary(2),
    status: "graded", score: 6, feedback: "Submitted after the deadline; partial credit applied.", submitted_at: daysFromNow(-13), graded_by: 1, graded_at: daysFromNow(-12),
    attachments: [{ id: 103, original_filename: "vocabulary-quiz.pdf", mime_type: "application/pdf", file_size: 18_900, uploaded_at: daysFromNow(-13) }],
  },
];
let nextSubmissionId = 1004;

// ---------------------------------------------------------------------------
// Exams (Backend-Almunirah/API_DOCUMENTATION.md §12, Phase 6, live) — no
// embedded course/class object, same convention as Material/Assignment.
// ---------------------------------------------------------------------------

/** Raw seed/mutation shape — `availability`/`question_count`/`attempts_used` are always computed, never stored. */
export type MockExam = Omit<Exam, "availability" | "question_count" | "attempts_used">;

export const exams: MockExam[] = [
  {
    id: 1,
    course_id: 1,
    class_id: 1,
    title: "Tajweed & Makharij Foundations",
    arabic_title: "أساسيات التجويد والمخارج",
    description: "A short CBT covering the foundational rules of Tajweed and correct letter articulation (Makharij).",
    arabic_description: null,
    language: "arabic",
    duration_minutes: 20,
    pass_mark: "6.00",
    total_marks: "10.00",
    max_attempts: 2,
    status: "published",
    starts_at: daysFromNow(-1),
    ends_at: daysFromNow(14),
    created_at: daysFromNow(-10),
    updated_at: daysFromNow(-10),
  },
  {
    id: 2,
    course_id: 2,
    class_id: 2,
    title: "Arabic Grammar Midterm",
    arabic_title: "اختبار منتصف الفصل — النحو",
    description: "Midterm assessment on i'rab and the 'Awamil Nawasikh covered so far this term.",
    arabic_description: null,
    language: "both",
    duration_minutes: 30,
    pass_mark: "3.00",
    total_marks: "5.00",
    max_attempts: 1,
    status: "published",
    starts_at: daysFromNow(7),
    ends_at: daysFromNow(21),
    created_at: daysFromNow(-6),
    updated_at: daysFromNow(-6),
  },
];
let nextExamId = 3;

/** Questions are exam-exclusive — no cross-exam reuse, no standalone bank (§12, confirmed with the backend). */
export const examQuestions: (ExamQuestionAdmin & { exam_id: number })[] = [
  {
    id: 1, exam_id: 1, type: "multiple_choice", marks: "2.00", order: 1,
    question_text: "What is the ruling when Noon Sakinah or Tanween is followed by the letter Ba (ب)?",
    arabic_question_text: "ما حكم النون الساكنة أو التنوين إذا جاء بعدها حرف الباء؟",
    options: [
      { id: 1, option_text: "Iqlab (conversion to Meem with Ghunnah)", arabic_option_text: "الإقلاب", is_correct: true },
      { id: 2, option_text: "Izhar (clear pronunciation)", arabic_option_text: "الإظهار", is_correct: false },
      { id: 3, option_text: "Idgham (assimilation)", arabic_option_text: "الإدغام", is_correct: false },
      { id: 4, option_text: "Ikhfa (concealment)", arabic_option_text: "الإخفاء", is_correct: false },
    ],
  },
  {
    id: 2, exam_id: 1, type: "true_false", marks: "1.00", order: 2,
    question_text: "Madd Asli (the natural elongation) is held for exactly 2 counts.",
    options: [
      { id: 5, option_text: "True", arabic_option_text: "صحيح", is_correct: true },
      { id: 6, option_text: "False", arabic_option_text: "خطأ", is_correct: false },
    ],
  },
  {
    id: 3, exam_id: 1, type: "multiple_answer", marks: "3.00", order: 3,
    question_text: "Which of the following are Huroof Qalqalah (echoing letters)?",
    arabic_question_text: "أي الحروف التالية من حروف القلقلة؟",
    options: [
      { id: 7, option_text: "Qaf (ق)", is_correct: true },
      { id: 8, option_text: "Ba (ب)", is_correct: true },
      { id: 9, option_text: "Jeem (ج)", is_correct: true },
      { id: 10, option_text: "Seen (س)", is_correct: false },
    ],
  },
  {
    id: 4, exam_id: 1, type: "multiple_choice", marks: "2.00", order: 4,
    question_text: "How many counts is Madd Muttasil held for?",
    options: [
      { id: 11, option_text: "2 counts", is_correct: false },
      { id: 12, option_text: "4-5 counts", is_correct: true },
      { id: 13, option_text: "6 counts only", is_correct: false },
      { id: 14, option_text: "1 count", is_correct: false },
    ],
  },
  {
    id: 5, exam_id: 1, type: "true_false", marks: "2.00", order: 5,
    question_text: "Ghunnah is a nasal sound held for approximately 2 counts.",
    options: [
      { id: 15, option_text: "True", arabic_option_text: "صحيح", is_correct: true },
      { id: 16, option_text: "False", arabic_option_text: "خطأ", is_correct: false },
    ],
  },
  {
    id: 6, exam_id: 2, type: "multiple_choice", marks: "2.00", order: 1,
    question_text: "What is the case ending (i'rab) of the subject (fa'il) of a verb?",
    options: [
      { id: 17, option_text: "Marfu' (nominative)", is_correct: true },
      { id: 18, option_text: "Mansub (accusative)", is_correct: false },
      { id: 19, option_text: "Majrur (genitive)", is_correct: false },
      { id: 20, option_text: "Majzum (jussive)", is_correct: false },
    ],
  },
  {
    id: 7, exam_id: 2, type: "true_false", marks: "1.00", order: 2,
    question_text: "A mubtada' (inchoative) is always in the nominative case.",
    options: [
      { id: 21, option_text: "True", arabic_option_text: "صحيح", is_correct: true },
      { id: 22, option_text: "False", arabic_option_text: "خطأ", is_correct: false },
    ],
  },
  {
    id: 8, exam_id: 2, type: "multiple_answer", marks: "2.00", order: 3,
    question_text: "Which of the following are among the 'Awamil Nawasikh that can enter a nominal sentence?",
    options: [
      { id: 23, option_text: "Kaana and her sisters", is_correct: true },
      { id: 24, option_text: "Inna and her sisters", is_correct: true },
      { id: 25, option_text: "A regular past-tense verb", is_correct: false },
    ],
  },
];
let nextQuestionId = 9;
let nextOptionId = 26;

export const examAttempts: ExamAttempt[] = [];
let nextAttemptId = 1;

/** Per-question saved answers for in-progress/submitted attempts — not embedded on the attempt itself (§12). */
export const examAttemptAnswers: { attempt_id: number; question_id: number; selected_option_ids: number[] }[] = [];

export const examResults: (ExamResult & { student_id: number })[] = [
  {
    id: 1,
    student_id: 2,
    exam: { id: 1, title: "Fiqh of Purification Quiz" },
    course: { id: 3, title: courses[2].name },
    attempt_id: 501,
    score: 22,
    total_marks: 25,
    percentage: 88,
    grade: "A",
    passed: true,
    published: true,
    taken_at: daysFromNow(-20),
  },
  {
    id: 2,
    student_id: 2,
    exam: { id: 1, title: "Aqeedah Basics Quiz" },
    course: { id: 4, title: courses[3].name },
    attempt_id: 502,
    score: 14,
    total_marks: 20,
    percentage: 70,
    grade: "B",
    passed: true,
    published: true,
    taken_at: daysFromNow(-35),
  },
];
let nextResultId = 3;

// ---------------------------------------------------------------------------
// Payments — matches API_DOCUMENTATION.md §3-4 exactly (Phase 2, live).
// ---------------------------------------------------------------------------

function userSummary(userId: number) {
  const u = users.find((x) => x.id === userId);
  return u ? { id: u.id, first_name: u.first_name, last_name: u.last_name, email: u.email } : undefined;
}

export const payments: (Payment & { student_id: number })[] = [
  { id: 1, student_id: 2, user_id: 2, user: userSummary(2), amount: "250.00", currency: "USD", reference: "ALM-0002", payment_date: daysFromNow(-118), payment_method: "bank_transfer", status: "approved", approved_by: 1, approved_at: daysFromNow(-115), receipts: [{ id: 1, original_filename: "receipt-0002.pdf", mime_type: "application/pdf", file_size: 293_102, uploaded_at: daysFromNow(-118) }], created_at: daysFromNow(-119), updated_at: daysFromNow(-115) },
  { id: 2, student_id: 3, user_id: 3, user: userSummary(3), amount: "250.00", currency: "USD", reference: "ALM-0003", payment_date: daysFromNow(-4), payment_method: "bank_transfer", status: "under_review", receipts: [{ id: 2, original_filename: "receipt-0003.jpg", mime_type: "image/jpeg", file_size: 184_400, uploaded_at: daysFromNow(-4) }], created_at: daysFromNow(-4), updated_at: daysFromNow(-4) },
  { id: 3, student_id: 4, user_id: 4, user: userSummary(4), amount: "200.00", currency: "USD", reference: "ALM-0004", payment_date: daysFromNow(-7), payment_method: "bank_transfer", status: "rejected", admin_notes: "The receipt amount does not match the published tuition fee for your class level.", rejected_at: daysFromNow(-6), receipts: [{ id: 3, original_filename: "receipt-0004.pdf", mime_type: "application/pdf", file_size: 201_880, uploaded_at: daysFromNow(-7) }], created_at: daysFromNow(-7), updated_at: daysFromNow(-6) },
  { id: 4, student_id: 5, user_id: 5, user: userSummary(5), amount: "250.00", currency: "USD", reference: "ALM-0005", payment_date: daysFromNow(-1), payment_method: "bank_transfer", status: "under_review", receipts: [{ id: 4, original_filename: "receipt-0005.png", mime_type: "image/png", file_size: 220_010, uploaded_at: daysFromNow(-1) }], created_at: daysFromNow(-1), updated_at: daysFromNow(-1) },
  { id: 5, student_id: 6, user_id: 6, user: userSummary(6), amount: "250.00", currency: "USD", reference: "ALM-0006", payment_date: daysFromNow(-199), payment_method: "bank_transfer", status: "approved", approved_by: 1, approved_at: daysFromNow(-197), receipts: [{ id: 5, original_filename: "receipt-0006.pdf", mime_type: "application/pdf", file_size: 175_200, uploaded_at: daysFromNow(-199) }], created_at: daysFromNow(-200), updated_at: daysFromNow(-197) },
];
let nextPaymentId = 6;
let nextReceiptId = 6;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications: (AppNotification & { user_id: number })[] = [
  { id: 1, user_id: 2, type: "assignment_graded", title: "Assignment graded", body: "Your submission for \"Memorization Check — Juz 30\" was graded: 18/20.", read_at: null, created_at: daysFromNow(-11) },
  { id: 2, user_id: 2, type: "material_uploaded", title: "New material uploaded", body: "\"Sarf Conjugation Walkthrough\" was added to Classical Arabic Grammar I.", read_at: null, created_at: daysFromNow(-2) },
  { id: 3, user_id: 2, type: "exam_scheduled", title: "New CBT test available", body: "\"Tajweed & Makharij Foundations\" is now open for attempts.", read_at: daysFromNow(-1), created_at: daysFromNow(-3) },
  { id: 4, user_id: 2, type: "payment_approved", title: "Payment approved", body: "Your tuition payment was verified and your account is now active.", read_at: daysFromNow(-115), created_at: daysFromNow(-118) },
  { id: 5, user_id: 2, type: "result_published", title: "Result published", body: "Your result for \"Fiqh of Purification Quiz\" is now available.", read_at: daysFromNow(-19), created_at: daysFromNow(-20) },
  { id: 6, user_id: 1, type: "payment_submitted", title: "New payment awaiting review", body: "Fatima Noor submitted a tuition receipt for review.", read_at: null, created_at: daysFromNow(-4) },
  { id: 7, user_id: 1, type: "payment_submitted", title: "New payment awaiting review", body: "Yusuf Hassan submitted a tuition receipt for review.", read_at: null, created_at: daysFromNow(-1) },
];
let nextNotificationId = 8;

// ---------------------------------------------------------------------------
// Public content
// ---------------------------------------------------------------------------

export const events: EventItem[] = [
  { id: 1, slug: "ramadan-umrah-1446-briefing", title: "Ramadan Umrah 1446 Pre-Departure Briefing", category: "Announcement", excerpt: "Mandatory briefing for all confirmed Ramadan Umrah pilgrims.", content: "All pilgrims confirmed for the Ramadan Umrah 1446 group must attend the mandatory pre-departure briefing. We will cover visa collection, packing guidance, and the Manasik schedule.\n\nPlease bring your passport and proof of vaccination.", is_published: true, event_date: daysFromNow(20), published_at: daysFromNow(-5) },
  { id: 2, slug: "annual-quran-competition", title: "Annual Qur'an Memorization Competition", category: "Seminar", excerpt: "Open to all Hifz students across every campus.", content: "Our annual memorization competition returns this year with categories for Juz 'Amma, 5 Juz, and Full Hifz. Registration closes two weeks before the event.", is_published: true, event_date: daysFromNow(35), published_at: daysFromNow(-10) },
  { id: 3, slug: "new-arabic-cohort-enrolling", title: "New Classical Arabic Cohort Now Enrolling", category: "Announcement", excerpt: "Evening and weekend sessions available.", content: "Our next Classical Arabic Grammar cohort begins next month, with both evening and weekend session options for working professionals.", is_published: true, event_date: null, published_at: daysFromNow(-2) },
  { id: 4, slug: "fiqh-seminar-contemporary-issues", title: "Fiqh Seminar: Contemporary Financial Issues", category: "Seminar", excerpt: "A one-day seminar with Sheikh Ibrahim Al-Sayed.", content: "This seminar covers Islamic rulings on modern financial instruments, cryptocurrency, and mortgage alternatives.", is_published: true, event_date: daysFromNow(12), published_at: daysFromNow(-8) },
  { id: 5, slug: "youth-madrasah-open-day", title: "Youth Weekend Madrasah Open Day", category: "Workshop", excerpt: "Bring the family to meet our youth faculty.", content: "An open day for prospective families to tour our facilities, meet the youth faculty, and see a sample class in session.", is_published: true, event_date: daysFromNow(18), published_at: daysFromNow(-1) },
];
let nextEventId = 6;

export const hajjUmrahPackages: HajjUmrahPackage[] = [
  { id: 1, slug: "ramadan-umrah-1446", type: "umrah", title: "Ramadan Umrah 1446", arabic_title: "عمرة رمضان ١٤٤٦", description: "10-night Ramadan Umrah with Haram-front accommodation in both Makkah and Madinah.", price: 3200, currency: "USD", duration_days: 10, is_published: true },
  { id: 2, slug: "executive-umrah", type: "umrah", title: "Executive Umrah Delegation", arabic_title: "وفد العمرة التنفيذي", description: "A smaller, premium group with private scholar-led Manasik sessions.", price: 4500, currency: "USD", duration_days: 7, is_published: true },
  { id: 3, slug: "hajj-1447-standard", type: "hajj", title: "Hajj 1447 — Standard Package", arabic_title: "حج ١٤٤٧ — الباقة القياسية", description: "Full Hajj delegation with Ministry-authorized Nusuk processing and resident scholar support.", price: 8900, currency: "USD", duration_days: 21, is_published: true },
  { id: 4, slug: "hajj-1447-executive", type: "hajj", title: "Hajj 1447 — Executive Package", arabic_title: "حج ١٤٤٧ — الباقة التنفيذية", description: "Five-star accommodation throughout with private transport and a dedicated Mutawwif.", price: 14500, currency: "USD", duration_days: 21, is_published: true },
];

export const hajjUmrahFaqs: HajjUmrahFaq[] = [
  { id: 1, question: "Do I need a Mahram to travel with your Umrah group?", answer: "Yes, per Ministry regulations, female pilgrims under 45 must travel with a Mahram unless part of an approved women-only group — contact our registry office for current group options." },
  { id: 2, question: "What is included in the package price?", answer: "Flights, Haram-front or near-Haram accommodation, private transport between cities, Nusuk visa processing, and scholar-led Manasik guidance throughout." },
  { id: 3, question: "How far in advance should I book?", answer: "We recommend booking at least 3 months in advance for Umrah and 6+ months for Hajj, as Nusuk visa slots are limited and allocated on a first-confirmed basis." },
  { id: 4, question: "Is travel insurance included?", answer: "Basic travel insurance is included; comprehensive upgrades are available at checkout for an additional fee." },
];

export const hajjUmrahAnnouncements: HajjUmrahAnnouncement[] = [
  { id: 1, title: "Ramadan Umrah 1446 — Final Seats Remaining", body: "Only a few seats remain for the Ramadan Umrah 1446 group. Deposits are due by the end of the month.", published_at: daysFromNow(-3) },
  { id: 2, title: "Hajj 1447 Registration Now Open", body: "Registration for Hajj 1447 packages is now open. Early registration includes a complimentary Manasik intensive clinic.", published_at: daysFromNow(-15) },
];

// ---------------------------------------------------------------------------
// Organization settings
// ---------------------------------------------------------------------------

export const orgSettings: OrganizationSettings = {
  site_name: "Al-Munirat Academy",
  contact_email: "registry@almunirat.org",
  contact_phone: "+44 121 496 0102",
  address: "14 Crescent Road, Birmingham, B12 9QW, United Kingdom",
  payment: {
    bank_name: "Al-Amanah Islamic Bank",
    account_name: "Al-Munirat Academy Trust",
    account_number: "01234567 / 40-51-62",
    amount: "250",
    currency: "USD",
    reference: "ALM-TUITION-2026",
  },
};

/**
 * Matches Backend-Almunirah/API_DOCUMENTATION.md §11 exactly (the public-
 * content batch, live) — a separate, unauthenticated flat key-value store,
 * distinct from `orgSettings` above (which backs the admin-only tuition
 * instructions). No admin management endpoint exists yet (seed-only).
 */
export const publicSettings: PublicSettings = {
  site_name: "Al-Munirat Academy",
  site_name_arabic: "أكاديمية المنيرة",
  tagline: "Islamic Madrasah & Hajj and Umrah Services",
  tagline_arabic: "مدرسة إسلامية وخدمات الحج والعمرة",
  description: "A global institution of sacred Islamic academia and boutique pilgrimage direction.",
  description_arabic: "مؤسسة عالمية للعلوم الشرعية الأصيلة وتوجيه رحلات الحج والعمرة المتميزة.",
  logo_url: null,
  contact_email: "registry@almunirat.org",
  contact_phone: "+44 121 496 0102",
  contact_address: "14 Crescent Road, Birmingham, B12 9QW, United Kingdom",
  contact_address_arabic: "14 كريسنت رود، برمنغهام، المملكة المتحدة",
  social_facebook: "https://facebook.com/almunirat",
  social_twitter: "https://twitter.com/almunirat",
  social_instagram: "https://instagram.com/almunirat",
  social_youtube: null,
  social_whatsapp: "+44 121 496 0102",
  established_year: "2014",
};

// ---------------------------------------------------------------------------
// Mock auth tokens: "mock-token-<userId>"
// ---------------------------------------------------------------------------

export function issueToken(userId: number): string {
  return `mock-token-${userId}`;
}

export function userFromToken(token: string | null): User | null {
  if (!token) return null;
  const match = /^mock-token-(\d+)$/.exec(token);
  if (!match) return null;
  return users.find((u) => u.id === Number(match[1])) ?? null;
}

export function findUserByEmail(email: string): User | null {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function createUser(payload: Omit<User, "id" | "created_at" | "role" | "account_status">): User {
  const user: User = {
    ...payload,
    id: nextUserId++,
    role: "student",
    account_status: "pending_payment",
    created_at: now(),
  };
  users.push(user);
  return user;
}

// ---------------------------------------------------------------------------
// ID generators + small collection helpers used by handlers
// ---------------------------------------------------------------------------

export const ids = {
  course: () => nextCourseId++,
  material: () => nextMaterialId++,
  assignment: () => nextAssignmentId++,
  submission: () => nextSubmissionId++,
  attachment: () => nextAttachmentId++,
  question: () => nextQuestionId++,
  option: () => nextOptionId++,
  exam: () => nextExamId++,
  attempt: () => nextAttemptId++,
  result: () => nextResultId++,
  payment: () => nextPaymentId++,
  receipt: () => nextReceiptId++,
  notification: () => nextNotificationId++,
  event: () => nextEventId++,
};

export function nowIso(): string {
  return now();
}

export function inMinutes(n: number): string {
  return new Date(Date.now() + n * 60_000).toISOString();
}

export function gradeFromPercentage(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/** Informational only, derived from starts_at/ends_at — real enforcement is in the `start` handler (§12). */
export function examAvailability(exam: Pick<MockExam, "starts_at" | "ends_at">): ExamAvailability {
  const nowMs = Date.now();
  if (exam.starts_at && new Date(exam.starts_at).getTime() > nowMs) return "upcoming";
  if (exam.ends_at && new Date(exam.ends_at).getTime() < nowMs) return "closed";
  return "open";
}

export function examQuestionCount(examId: number): number {
  return examQuestions.filter((q) => q.exam_id === examId).length;
}

/** Builds the full `Exam` response shape; `attempts_used` only appears when `forStudentId` is given (§12). */
export function toExam(exam: MockExam, forStudentId?: number): Exam {
  const full: Exam = {
    ...exam,
    availability: examAvailability(exam),
    question_count: examQuestionCount(exam.id),
  };
  if (forStudentId !== undefined) {
    full.attempts_used = examAttempts.filter(
      (a) => a.exam_id === exam.id && a.user_id === forStudentId && a.status === "submitted",
    ).length;
  }
  return full;
}

export function saveAnswer(attemptId: number, questionId: number, selectedOptionIds: number[]) {
  const existing = examAttemptAnswers.find((a) => a.attempt_id === attemptId && a.question_id === questionId);
  if (existing) existing.selected_option_ids = selectedOptionIds;
  else examAttemptAnswers.push({ attempt_id: attemptId, question_id: questionId, selected_option_ids: selectedOptionIds });
}

export function answersForAttempt(attemptId: number) {
  return examAttemptAnswers.filter((a) => a.attempt_id === attemptId);
}

function selectedOptionIdsFor(attemptId: number, questionId: number): number[] {
  return examAttemptAnswers.find((a) => a.attempt_id === attemptId && a.question_id === questionId)?.selected_option_ids ?? [];
}

/** Strips `is_correct` — students must never receive the answer key (verified live against the real backend, §12). */
export function studentQuestionsFor(examId: number, attemptId: number) {
  return examQuestions
    .filter((q) => q.exam_id === examId)
    .sort((a, b) => a.order - b.order)
    .map(({ id, type, question_text, arabic_question_text, marks, order, options }) => ({
      id,
      type,
      question_text,
      arabic_question_text,
      marks,
      order,
      options: options.map(({ id: optId, option_text, arabic_option_text, order: optOrder }) => ({
        id: optId,
        option_text,
        arabic_option_text,
        order: optOrder,
      })),
      selected_option_ids: selectedOptionIdsFor(attemptId, id),
    }));
}

/** All-or-nothing per question, uniformly across question types — matches the real scoring policy exactly (§12). */
export function scoreAttempt(examId: number, attemptId: number): { score: number; totalMarks: number; percentage: number } {
  const questions = examQuestions.filter((q) => q.exam_id === examId);
  let score = 0;
  let totalMarks = 0;
  for (const q of questions) {
    const marks = Number(q.marks);
    totalMarks += marks;
    const correctIds = q.options.filter((o) => o.is_correct).map((o) => o.id).sort().join(",");
    const selectedIds = selectedOptionIdsFor(attemptId, q.id).slice().sort().join(",");
    if (correctIds && correctIds === selectedIds) score += marks;
  }
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  return { score, totalMarks, percentage };
}

function finalizeAttempt(attempt: ExamAttempt) {
  const exam = exams.find((e) => e.id === attempt.exam_id);
  const { score, totalMarks, percentage } = scoreAttempt(attempt.exam_id, attempt.id);
  attempt.status = "submitted";
  attempt.submitted_at = nowIso();
  attempt.score = score.toFixed(2);
  attempt.total_marks = totalMarks.toFixed(2);
  attempt.percentage = percentage.toFixed(2);
  attempt.passed = exam ? score >= Number(exam.pass_mark) : false;
}

/**
 * Lazy timer enforcement (§12) — no scheduled job closes an expired attempt
 * on its own; this is called at the top of resume/answers/submit instead,
 * mirroring `ExamScoringService::autoSubmitIfExpired()`.
 */
export function autoSubmitIfExpired(attempt: ExamAttempt): ExamAttempt {
  if (attempt.status === "in_progress" && new Date(attempt.ends_at).getTime() <= Date.now()) {
    finalizeAttempt(attempt);
  }
  return attempt;
}

/** `submit` is idempotent — calling it again just returns the already-final result (§12). */
export function submitAttempt(attempt: ExamAttempt): ExamAttempt {
  if (attempt.status === "in_progress") finalizeAttempt(attempt);
  return attempt;
}

/**
 * Attaches `submission_status`/`submission` for one student — computed,
 * never stored on the Assignment row itself (API_DOCUMENTATION.md §10:
 * admin CRUD responses never include these fields at all).
 */
export function assignmentForStudent(assignment: Assignment, studentId: number): Assignment {
  const submission = assignmentSubmissions.find((s) => s.assignment_id === assignment.id && s.student_id === studentId) ?? null;
  const submission_status: SubmissionStatus = submission ? submission.status : "not_started";
  return { ...assignment, submission_status, submission };
}
