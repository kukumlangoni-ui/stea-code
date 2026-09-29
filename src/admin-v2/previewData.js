const now = Date.now();
const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000);
const iso = (days) => daysAgo(days).toISOString();
const stamp = (days) => ({ toDate: () => daysAgo(days) });
const doc = (id, data) => ({ id, ...data });

export const ADMIN_V2_PREVIEW_USER = {
  uid: "preview-admin",
  email: "preview@stea.africa",
  displayName: "Preview Admin",
  role: "super_admin",
  photoURL: "",
};

export const ADMIN_V2_PREVIEW_BANNER = "DEV PREVIEW MODE — No real data changes";

export const ADMIN_V2_PREVIEW_COLLECTIONS = {
  users: [
    doc("user_alpha", {
      displayName: "Amina Hassan",
      email: "amina@stea.africa",
      role: "admin",
      status: "active",
      provider: "google",
      createdAt: stamp(120),
      lastActive: stamp(2),
      phone: "+255712345678",
      classroomRole: "teacher",
      marketplaceRole: "seller",
      savedResourcesCount: 12,
      photoURL: "",
    }),
    doc("user_beta", {
      displayName: "Brian Mushi",
      email: "brian@stea.africa",
      role: "manager",
      status: "active",
      provider: "email",
      createdAt: stamp(45),
      lastActive: stamp(1),
      classroomRole: "student",
      marketplaceRole: "buyer",
      savedResources: ["r1", "r2"],
    }),
  ],
  study_resources: [doc("sr_1", { title: "Algebra Notes", type: "note", subject: "Mathematics", status: "published", authorName: "Amina Hassan", createdAt: stamp(20), updatedAt: stamp(5), fileUrl: "https://example.com/algebra.pdf", description: "Form 3 algebra revision." })],
  resources: [doc("res_1", { title: "Study Skills Guide", type: "resource", category: "Study Skills", status: "published", uploaderName: "Brian Mushi", createdAt: stamp(18), updatedAt: stamp(4), link: "https://example.com/study-skills" })],
  education_notes: [doc("note_1", { title: "Physics Notes", type: "note", category: "Physics", status: "draft", uploaderName: "Amina Hassan", createdAt: stamp(17), updatedAt: stamp(3), pdfUrl: "https://example.com/physics.pdf" })],
  education_past_papers: [doc("paper_1", { title: "NECTA 2022", type: "past_paper", category: "Exam Papers", status: "published", uploaderName: "Brian Mushi", createdAt: stamp(14), updatedAt: stamp(2), pdfUrl: "https://example.com/necta2022.pdf" })],
  tips_resources: [doc("tip_1", { title: "Revision Tips", type: "tip", category: "Learning Tips", status: "published", authorName: "STEA Team", createdAt: stamp(10), updatedAt: stamp(1), url: "https://example.com/revision-tips" })],
  classes: [doc("class_1", { className: "Form 4 A", teacherName: "Amina Hassan", studentsCount: 34, status: "active", createdAt: stamp(90) })],
  attendanceClasses: [doc("att_legacy_1", { className: "Form 3 B", teacherName: "Brian Mushi", studentsCount: 28, status: "legacy", createdAt: stamp(88) })],
  attendanceSessions: [doc("session_1", { sessionTitle: "Morning attendance", className: "Form 4 A", teacherName: "Amina Hassan", status: "open", studentCount: 33, createdAt: stamp(3) })],
  attendanceRecords: [doc("record_1", { sessionTitle: "Morning attendance", studentName: "Leah", status: "present", createdAt: stamp(3) })],
  assignments: [doc("assign_1", { title: "Quadratic Equations", className: "Form 4 A", teacherName: "Amina Hassan", dueDate: iso(6), status: "open", totalMarks: 20, createdAt: stamp(9) })],
  assignmentSubmissions: [doc("submission_1", { assignmentTitle: "Quadratic Equations", studentName: "Leah", className: "Form 4 A", status: "submitted", marks: 18, submittedDate: iso(5) })],
  quizzes: [doc("quiz_1", { title: "Science Quiz", className: "Form 3 B", teacherName: "Brian Mushi", status: "published", createdAt: stamp(8) })],
  quizResults: [doc("quiz_result_1", { quizTitle: "Science Quiz", studentName: "Leah", score: 82, className: "Form 3 B", submittedDate: iso(7) })],
  classroomAuditLogs: [doc("class_log_1", { action: "grade_submission", entity: "assignmentSubmissions", entityId: "submission_1", performedByEmail: "preview@stea.africa", severity: "medium", reason: "Preview record", timestamp: iso(2) })],
  websites: [doc("site_1", { name: "STEA School", url: "https://stea.africa", category: "Education", status: "published", featured: true, ownerName: "Preview Admin", createdAt: stamp(40), updatedAt: stamp(4), description: "Official demo site", imageUrl: "https://example.com/site.png", tags: ["school", "education"], views: 1200 })],
  website_solution_categories: [doc("web_cat_1", { name: "Education", slug: "education", status: "active", createdAt: stamp(60) }), doc("web_cat_2", { name: "Business", slug: "business", status: "active", createdAt: stamp(55) })],
  products: [doc("prod_1", { productName: "Math Revision Pack", category: "Books", sellerName: "Amina Hassan", price: 12000, status: "active", stock: 14, createdAt: stamp(15), imageUrl: "https://example.com/product.png" })],
  marketplace_orders: [doc("order_1", { orderId: "ORD-1001", buyerName: "Leah", sellerName: "Amina Hassan", totalAmount: 12000, status: "paid", createdAt: stamp(6) })],
  orders: [doc("order_copy_1", { orderId: "ORD-1001", buyerName: "Leah", sellerName: "Amina Hassan", totalAmount: 12000, status: "paid", createdAt: stamp(6) })],
  payments: [doc("pay_1", { paymentId: "PAY-9001", userName: "Leah", amountPaid: 12000, paymentMethod: "M-Pesa", status: "approved", orderId: "ORD-1001", createdAt: stamp(5), sourceCollection: "payments" })],
  sellers: [doc("seller_1", { fullName: "Amina Hassan", email: "amina@stea.africa", status: "approved", createdAt: stamp(30), userId: "user_alpha" })],
  seller_applications: [doc("seller_app_1", { fullName: "Leah", email: "leah@stea.africa", businessName: "Leah Books", status: "pending", createdAt: stamp(12) })],
  service_requests: [doc("srv_req_1", { requestId: "REQ-11", serviceType: "Website Design", clientName: "Leah", email: "leah@stea.africa", status: "pending", budget: 300000, createdAt: stamp(7) })],
  serviceSubscriptions: [doc("srv_sub_1", { subscriptionId: "SUB-11", serviceName: "Website Design", planName: "Pro", userName: "Leah", amount: 300000, status: "active", createdAt: stamp(8) })],
  servicePaymentMethods: [doc("srv_pay_1", { name: "M-Pesa", type: "mobile_money", status: "active", currency: "TZS", createdAt: stamp(30) })],
  subscriptionServices: [doc("srv_plan_1", { planName: "Starter", serviceName: "Website Design", price: 150000, durationDays: 30, status: "active" })],
  servicePlans: [doc("srv_plan_2", { planName: "Pro", serviceName: "Website Design", price: 300000, durationDays: 90, status: "active" })],
  toolSubscriptions: [doc("tool_sub_1", { toolName: "Digital Tools Suite", planName: "Pro", userName: "Brian Mushi", amount: 250000, status: "active", createdAt: stamp(11) })],
  notifications: [doc("note_1", { title: "Homework Reminder", message: "Submit your assignment by 6 PM.", target: "students", userName: "Class 4A", status: "sent", readCount: 28, createdAt: stamp(2), readBy: ["user_beta"], isRead: true })],
  notificationCampaigns: [doc("camp_1", { campaignName: "Weekly Digest", targetAudience: "all users", status: "sent", sentCount: 140, readCount: 98, createdAt: stamp(4) })],
  notificationTokens: [doc("token_1", { userName: "Amina Hassan", platform: "android", status: "active", topics: ["students"], createdAt: stamp(60), updatedAt: stamp(1) })],
  fcm_tokens: [doc("fcm_1", { userName: "Legacy Device", platform: "web", status: "unknown", topics: ["announcements"], createdAt: stamp(70), updatedAt: stamp(3) })],
  audit_logs: [doc("audit_1", { action: "update_role", entity: "users", entityId: "user_beta", performedByEmail: "preview@stea.africa", severity: "medium", reason: "Preview mode entry", timestamp: iso(1) })],
  feedback: [doc("feedback_1", { title: "Add study timers", message: "A study timer would help.", status: "open", rating: 5, createdAt: stamp(9) })],
  reports: [doc("report_1", { title: "Broken resource link", message: "One PDF link is not working.", status: "open", severity: "high", createdAt: stamp(7) })],
  analytics_events: [doc("event_1", { eventName: "page_view", section: "admin", count: 42, createdAt: stamp(1) })],
  updates: [doc("update_1", { title: "Admin V2 Preview", status: "published", createdAt: stamp(2) })],
  points_history: [doc("points_1", { userName: "Leah", points: 50, reason: "Completed quiz", createdAt: stamp(1) })],
  site_settings: [doc("settings_1", { homepageTitle: "STEA Africa", supportEmail: "support@stea.africa", maintenanceMode: false })],
  paymentSettings: [doc("payment_settings_1", { provider: "M-Pesa", currency: "TZS", status: "active" })],
  subscription_settings: [doc("subscription_settings_1", { trialDays: 7, status: "active" })],
  digital_tools: [doc("tool_1", { title: "Study Planner", category: "Productivity", status: "active", createdAt: stamp(13) })],
  digitalTools: [doc("tool_copy_1", { title: "Study Planner", category: "Productivity", status: "active", createdAt: stamp(13) })],
};

export const ADMIN_V2_PREVIEW_COUNTS = Object.fromEntries(Object.entries(ADMIN_V2_PREVIEW_COLLECTIONS).map(([key, value]) => [key, value.length]));

export function getPreviewCollectionDocs(name) {
  return ADMIN_V2_PREVIEW_COLLECTIONS[name] || [];
}

export function getPreviewCollectionCount(name) {
  return ADMIN_V2_PREVIEW_COUNTS[name] ?? 0;
}
