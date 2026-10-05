ALTER TABLE "school_class_sections" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "school_class_sections" CASCADE;--> statement-breakpoint
DROP INDEX "student_attendance_school_section_idx";--> statement-breakpoint
DROP INDEX "exam_sessions_school_section_idx";--> statement-breakpoint
DROP INDEX "promotion_rules_source_school_idx";--> statement-breakpoint
DROP INDEX "teacher_assignments_school_idx";--> statement-breakpoint
DROP INDEX "teacher_timetable_school_idx";--> statement-breakpoint
CREATE INDEX "promotion_rules_source_school_idx" ON "promotion_rules" USING btree ("source_school_class_id");--> statement-breakpoint
CREATE INDEX "teacher_assignments_school_idx" ON "teacher_assignments" USING btree ("school_class_id");--> statement-breakpoint
CREATE INDEX "teacher_timetable_school_idx" ON "teacher_timetable_periods" USING btree ("school_class_id");--> statement-breakpoint
ALTER TABLE "promotion_rules" DROP COLUMN "source_school_section_id";--> statement-breakpoint
ALTER TABLE "promotion_rules" DROP COLUMN "target_school_section_id";--> statement-breakpoint
ALTER TABLE "admission_applications" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "student_attendance" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "exam_marks" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "exam_results" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "exam_sessions" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "fee_charges" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "student_enrollments" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "teacher_assignments" DROP COLUMN "school_section_id";--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" DROP COLUMN "school_section_id";