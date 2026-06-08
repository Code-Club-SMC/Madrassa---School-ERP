export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "approve"
  | "mark_entry"
  | "print"
  | "manage";

export type ModuleKey =
  | "dashboard"
  | "admission_new"
  | "admission_queue"
  | "madrassa_students"
  | "madrassa_attendance"
  | "madrassa_fees"
  | "madrassa_categories"
  | "madrassa_exams_internal"
  | "madrassa_exams_board"
  | "madrassa_timetable"
  | "madrassa_hifz"
  | "school_students"
  | "school_attendance"
  | "school_fees"
  | "school_classes"
  | "school_exams_internal"
  | "school_exams_board"
  | "school_timetable"
  | "teachers"
  | "id_cards"
  | "reports_attendance"
  | "reports_category"
  | "reports_results"
  | "reports_monthly"
  | "reports_annual"
  | "inventory"
  | "finance"
  | "users"
  | "settings_academic_year"
  | "settings_holidays"
  | "settings_website"
  | "settings_audit";

export type ModulePermission = Partial<Record<PermissionAction, boolean>>;
export type UserPermissions = Partial<Record<ModuleKey, ModulePermission>>;

export type ModuleDefinition = {
  key: ModuleKey;
  nameUrdu: string;
  nameEnglish: string;
  system: "global" | "madrassa" | "school" | "admin";
  group: string;
  groupUrdu: string;
  availableActions: PermissionAction[];
  superAdminOnly?: boolean;
};

export const MODULE_REGISTRY: ModuleDefinition[] = [
  { key: "dashboard", nameUrdu: "ڈیش بورڈ", nameEnglish: "Analytics Dashboard", system: "global", group: "Global", groupUrdu: "عمومی", availableActions: ["view"] },
  { key: "admission_new", nameUrdu: "نیا داخلہ", nameEnglish: "New Admission", system: "global", group: "Global", groupUrdu: "عمومی", availableActions: ["view", "create"] },
  { key: "admission_queue", nameUrdu: "آن لائن درخواستیں", nameEnglish: "Application Queue", system: "global", group: "Global", groupUrdu: "عمومی", availableActions: ["view", "approve", "delete"] },

  { key: "madrassa_students", nameUrdu: "مدرسہ — طلبہ", nameEnglish: "Madrassa Students", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit", "delete", "export", "print"] },
  { key: "madrassa_attendance", nameUrdu: "مدرسہ — حاضری", nameEnglish: "Madrassa Attendance", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit", "export"] },
  { key: "madrassa_fees", nameUrdu: "مدرسہ — فیس", nameEnglish: "Madrassa Fees", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit", "delete", "export", "print"] },
  { key: "madrassa_categories", nameUrdu: "مدرسہ — اقسام", nameEnglish: "Madrassa Categories", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit", "delete"] },
  { key: "madrassa_exams_internal", nameUrdu: "مدرسہ — داخلی امتحانات", nameEnglish: "Madrassa Internal Exams", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit", "delete", "mark_entry", "print", "export"] },
  { key: "madrassa_exams_board", nameUrdu: "مدرسہ — وفاقی امتحانات", nameEnglish: "Madrassa Board Exams", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit", "export"] },
  { key: "madrassa_timetable", nameUrdu: "مدرسہ — ٹائم ٹیبل", nameEnglish: "Madrassa Timetable", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit", "delete", "print"] },
  { key: "madrassa_hifz", nameUrdu: "حفظ ٹریکر", nameEnglish: "Hifz Tracker", system: "madrassa", group: "Madrassa", groupUrdu: "مدرسہ", availableActions: ["view", "create", "edit"] },

  { key: "school_students", nameUrdu: "اسکول — طلبہ", nameEnglish: "School Students", system: "school", group: "School", groupUrdu: "اسکول", availableActions: ["view", "create", "edit", "delete", "export", "print"] },
  { key: "school_attendance", nameUrdu: "اسکول — حاضری", nameEnglish: "School Attendance", system: "school", group: "School", groupUrdu: "اسکول", availableActions: ["view", "create", "edit", "export"] },
  { key: "school_fees", nameUrdu: "اسکول — فیس", nameEnglish: "School Fees", system: "school", group: "School", groupUrdu: "اسکول", availableActions: ["view", "create", "edit", "delete", "export", "print"] },
  { key: "school_classes", nameUrdu: "اسکول — جماعتیں", nameEnglish: "School Classes & Sections", system: "school", group: "School", groupUrdu: "اسکول", availableActions: ["view", "create", "edit", "delete"] },
  { key: "school_exams_internal", nameUrdu: "اسکول — داخلی امتحانات", nameEnglish: "School Internal Exams", system: "school", group: "School", groupUrdu: "اسکول", availableActions: ["view", "create", "edit", "delete", "mark_entry", "print", "export"] },
  { key: "school_exams_board", nameUrdu: "اسکول — بورڈ امتحانات", nameEnglish: "School Board Exams (BISE)", system: "school", group: "School", groupUrdu: "اسکول", availableActions: ["view", "create", "edit", "export"] },
  { key: "school_timetable", nameUrdu: "اسکول — ٹائم ٹیبل", nameEnglish: "School Timetable", system: "school", group: "School", groupUrdu: "اسکول", availableActions: ["view", "create", "edit", "delete", "print"] },

  { key: "teachers", nameUrdu: "اساتذہ", nameEnglish: "Teachers", system: "global", group: "Shared", groupUrdu: "مشترکہ", availableActions: ["view", "create", "edit", "delete", "print", "export"] },
  { key: "id_cards", nameUrdu: "شناختی کارڈ", nameEnglish: "ID Card Generator", system: "global", group: "Shared", groupUrdu: "مشترکہ", availableActions: ["view", "print"] },

  { key: "reports_attendance", nameUrdu: "رپورٹ — حاضری", nameEnglish: "Attendance Report", system: "global", group: "Reports", groupUrdu: "رپورٹس", availableActions: ["view", "export", "print"] },
  { key: "reports_category", nameUrdu: "رپورٹ — اقسام", nameEnglish: "Category-wise Report", system: "global", group: "Reports", groupUrdu: "رپورٹس", availableActions: ["view", "export", "print"] },
  { key: "reports_results", nameUrdu: "رپورٹ — نتائج", nameEnglish: "Exam Results Report", system: "global", group: "Reports", groupUrdu: "رپورٹس", availableActions: ["view", "export", "print"] },
  { key: "reports_monthly", nameUrdu: "رپورٹ — ماہانہ", nameEnglish: "Monthly Report", system: "global", group: "Reports", groupUrdu: "رپورٹس", availableActions: ["view", "export", "print"] },
  { key: "reports_annual", nameUrdu: "رپورٹ — سالانہ", nameEnglish: "Annual Report", system: "global", group: "Reports", groupUrdu: "رپورٹس", availableActions: ["view", "export", "print"] },

  { key: "inventory", nameUrdu: "انوینٹری", nameEnglish: "Inventory Management", system: "global", group: "Finance & Inventory", groupUrdu: "مالیات و انوینٹری", availableActions: ["view", "create", "edit", "delete", "export"] },
  { key: "finance", nameUrdu: "مالیات", nameEnglish: "Finance Dashboard", system: "global", group: "Finance & Inventory", groupUrdu: "مالیات و انوینٹری", availableActions: ["view", "create", "edit", "delete", "export", "print"] },

  { key: "users", nameUrdu: "صارف انتظام", nameEnglish: "User Management", system: "admin", group: "Administration", groupUrdu: "انتظامیہ", availableActions: ["view", "create", "edit", "delete", "manage"], superAdminOnly: true },
  { key: "settings_academic_year", nameUrdu: "تعلیمی سال", nameEnglish: "Academic Year Settings", system: "admin", group: "Administration", groupUrdu: "انتظامیہ", availableActions: ["view", "manage"] },
  { key: "settings_holidays", nameUrdu: "تعطیلات کیلنڈر", nameEnglish: "Holiday Calendar", system: "admin", group: "Administration", groupUrdu: "انتظامیہ", availableActions: ["view", "create", "edit", "delete"] },
  { key: "settings_website", nameUrdu: "ویب سائٹ مواد", nameEnglish: "Website Content", system: "admin", group: "Administration", groupUrdu: "انتظامیہ", availableActions: ["view", "edit", "manage"] },
  { key: "settings_audit", nameUrdu: "آڈٹ لاگ", nameEnglish: "Audit Log", system: "admin", group: "Administration", groupUrdu: "انتظامیہ", availableActions: ["view", "export"], superAdminOnly: true },
];

export const ACTION_META: Record<PermissionAction, { labelUrdu: string; labelEnglish: string; description: string }> = {
  view:       { labelUrdu: "دیکھیں",     labelEnglish: "View",       description: "Can access and view this module" },
  create:     { labelUrdu: "بنائیں",     labelEnglish: "Create",     description: "Can create new records" },
  edit:       { labelUrdu: "ترمیم",      labelEnglish: "Edit",       description: "Can modify existing records" },
  delete:     { labelUrdu: "حذف",        labelEnglish: "Delete",     description: "Can permanently delete records" },
  export:     { labelUrdu: "برآمد",      labelEnglish: "Export",     description: "Can export data as PDF/Excel" },
  approve:    { labelUrdu: "منظور",      labelEnglish: "Approve",    description: "Can approve/reject applications" },
  mark_entry: { labelUrdu: "نمبر درج",   labelEnglish: "Mark Entry", description: "Can enter exam marks" },
  print:      { labelUrdu: "پرنٹ",       labelEnglish: "Print",      description: "Can print cards, receipts, and reports" },
  manage:     { labelUrdu: "انتظام",     labelEnglish: "Manage",     description: "Full administrative control" },
};

export const PERMISSION_GROUPS = [
  { key: "Global", urdu: "عمومی" },
  { key: "Madrassa", urdu: "مدرسہ" },
  { key: "School", urdu: "اسکول" },
  { key: "Shared", urdu: "مشترکہ" },
  { key: "Reports", urdu: "رپورٹس" },
  { key: "Finance & Inventory", urdu: "مالیات و انوینٹری" },
  { key: "Administration", urdu: "انتظامیہ" },
] as const;