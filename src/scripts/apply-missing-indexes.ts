import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying missing database indexes...");

  const queries = [
    // Exam Marks & Results
    `CREATE UNIQUE INDEX IF NOT EXISTS exam_marks_subject_student_idx ON public.exam_marks (exam_subject_id, student_id, enrollment_id);`,
    `CREATE INDEX IF NOT EXISTS exam_marks_exam_idx ON public.exam_marks (exam_id);`,
    `CREATE INDEX IF NOT EXISTS exam_marks_student_idx ON public.exam_marks (student_id);`,
    `CREATE INDEX IF NOT EXISTS exam_marks_enrollment_idx ON public.exam_marks (enrollment_id);`,
    `CREATE INDEX IF NOT EXISTS exam_marks_status_idx ON public.exam_marks (status);`,

    `CREATE UNIQUE INDEX IF NOT EXISTS exam_results_exam_student_idx ON public.exam_results (exam_id, student_id, enrollment_id);`,
    `CREATE INDEX IF NOT EXISTS exam_results_exam_idx ON public.exam_results (exam_id);`,
    `CREATE INDEX IF NOT EXISTS exam_results_student_idx ON public.exam_results (student_id);`,
    `CREATE INDEX IF NOT EXISTS exam_results_enrollment_idx ON public.exam_results (enrollment_id);`,
    `CREATE INDEX IF NOT EXISTS exam_results_status_idx ON public.exam_results (status);`,
    `CREATE INDEX IF NOT EXISTS exam_results_position_idx ON public.exam_results (position);`,

    // Exam Sessions & Subjects
    `CREATE UNIQUE INDEX IF NOT EXISTS exam_session_subjects_exam_subject_idx ON public.exam_session_subjects (exam_id, subject_id);`,
    `CREATE INDEX IF NOT EXISTS exam_session_subjects_exam_idx ON public.exam_session_subjects (exam_id);`,
    `CREATE INDEX IF NOT EXISTS exam_session_subjects_subject_idx ON public.exam_session_subjects (subject_id);`,
    `CREATE INDEX IF NOT EXISTS exam_session_subjects_exam_date_idx ON public.exam_session_subjects (exam_date);`,

    `CREATE UNIQUE INDEX IF NOT EXISTS exam_subjects_system_code_scope_idx ON public.exam_subjects (system, code, school_class_id, madrassa_subcategory_id);`,
    `CREATE INDEX IF NOT EXISTS exam_subjects_system_idx ON public.exam_subjects (system);`,
    `CREATE INDEX IF NOT EXISTS exam_subjects_school_class_idx ON public.exam_subjects (school_class_id);`,
    `CREATE INDEX IF NOT EXISTS exam_subjects_madrassa_subcategory_idx ON public.exam_subjects (madrassa_subcategory_id);`,
    `CREATE INDEX IF NOT EXISTS exam_subjects_active_idx ON public.exam_subjects (active);`,

    `CREATE INDEX IF NOT EXISTS exam_sessions_system_idx ON public.exam_sessions (system);`,
    `CREATE INDEX IF NOT EXISTS exam_sessions_institution_idx ON public.exam_sessions (institution_id);`,
    `CREATE INDEX IF NOT EXISTS exam_sessions_program_idx ON public.exam_sessions (program_id);`,
    `CREATE INDEX IF NOT EXISTS exam_sessions_school_class_idx ON public.exam_sessions (school_class_id);`,
    `CREATE INDEX IF NOT EXISTS exam_sessions_madrassa_category_idx ON public.exam_sessions (madrassa_category_id);`,
    `CREATE INDEX IF NOT EXISTS exam_sessions_madrassa_subcategory_idx ON public.exam_sessions (madrassa_subcategory_id);`,
    `CREATE INDEX IF NOT EXISTS exam_sessions_academic_year_idx ON public.exam_sessions (academic_year);`,
    `CREATE INDEX IF NOT EXISTS exam_sessions_status_idx ON public.exam_sessions (status);`,

    // Exam Halls & Seating
    `CREATE INDEX IF NOT EXISTS exam_halls_system_idx ON public.exam_halls (system);`,
    `CREATE INDEX IF NOT EXISTS exam_halls_active_idx ON public.exam_halls (active);`,

    `CREATE UNIQUE INDEX IF NOT EXISTS exam_seating_plans_exam_version_idx ON public.exam_seating_plans (exam_id, version);`,
    `CREATE INDEX IF NOT EXISTS exam_seating_plans_exam_idx ON public.exam_seating_plans (exam_id);`,
    `CREATE INDEX IF NOT EXISTS exam_seating_plans_status_idx ON public.exam_seating_plans (status);`,

    `CREATE UNIQUE INDEX IF NOT EXISTS exam_seat_assignments_plan_hall_seat_idx ON public.exam_seat_assignments (seating_plan_id, hall_id, row_no, col_no);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS exam_seat_assignments_plan_student_idx ON public.exam_seat_assignments (seating_plan_id, student_id, enrollment_id);`,
    `CREATE INDEX IF NOT EXISTS exam_seat_assignments_exam_idx ON public.exam_seat_assignments (exam_id);`,
    `CREATE INDEX IF NOT EXISTS exam_seat_assignments_hall_idx ON public.exam_seat_assignments (hall_id);`,
    `CREATE INDEX IF NOT EXISTS exam_seat_assignments_student_idx ON public.exam_seat_assignments (student_id);`,

    // Timetable & Attendance
    `CREATE UNIQUE INDEX IF NOT EXISTS school_timetable_slots_period_day_idx ON public.school_timetable_slots (period_id, day_of_week);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS madrassa_timetable_slots_period_day_idx ON public.madrassa_timetable_slots (period_id, day_of_week);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS student_attendance_student_enrollment_date_idx ON public.student_attendance (student_id, enrollment_id, attendance_date);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS teacher_profiles_user_idx ON public.teacher_profiles (user_id);`,

    // Finance & Sequences
    `CREATE UNIQUE INDEX IF NOT EXISTS fee_allocations_payment_charge_idx ON public.fee_payment_allocations (payment_id, charge_id);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS number_sequences_scope_idx ON public.number_sequences (year, type, institution_id, program_id, school_class_id, madrassa_subcategory_id);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS finance_number_sequences_scope_idx ON public.finance_number_sequences (year, type, institution_id);`,

    // Students & Auth & Academic Years
    `CREATE UNIQUE INDEX IF NOT EXISTS guardians_cnic_unique_idx ON public.guardians (cnic);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS student_enrollments_admission_no_idx ON public.student_enrollments (admission_no);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS student_enrollments_roll_no_idx ON public.student_enrollments (roll_no);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS user_single_super_admin_idx ON public."user" (role) WHERE role = 'super_admin';`,
    `CREATE UNIQUE INDEX IF NOT EXISTS academic_years_one_active_per_system_idx ON public.academic_years (system, status) WHERE status = 'active';`,
  ];

  for (const q of queries) {
    try {
      await db.execute(sql.raw(q));
      console.log(`Executed: ${q.slice(0, 70)}...`);
    } catch (err: any) {
      console.error(`Failed: ${q}`, err.message);
    }
  }

  console.log("Finished applying indexes.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});

