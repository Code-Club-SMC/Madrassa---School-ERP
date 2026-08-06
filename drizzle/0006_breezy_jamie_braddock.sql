CREATE TABLE "exam_halls" (
	"id" text PRIMARY KEY NOT NULL,
	"system" text NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text,
	"rows" integer NOT NULL,
	"cols" integer NOT NULL,
	"aisle_every_row" integer DEFAULT 0 NOT NULL,
	"aisle_every_col" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_marks" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"exam_subject_id" text NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_category_id" text,
	"madrassa_subcategory_id" text,
	"attendance_status" text DEFAULT 'present' NOT NULL,
	"obtained_marks" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"entered_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_category_id" text,
	"madrassa_subcategory_id" text,
	"obtained_marks" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"percentage_times_100" integer NOT NULL,
	"grade" text NOT NULL,
	"status" text NOT NULL,
	"position" integer,
	"failed_subjects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp,
	"dmc_generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_seat_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"seating_plan_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"hall_id" text NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"row_no" integer NOT NULL,
	"col_no" integer NOT NULL,
	"seat_label" text NOT NULL,
	"placement_label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_seating_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"gap" integer DEFAULT 1 NOT NULL,
	"seed" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"unseated_students" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"violation_count" integer DEFAULT 0 NOT NULL,
	"generated_by_user_id" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"locked_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "exam_session_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"total_marks" integer NOT NULL,
	"passing_marks" integer NOT NULL,
	"exam_date" date,
	"start_time" text,
	"end_time" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"system" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_category_id" text,
	"madrassa_subcategory_id" text,
	"academic_year" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" text,
	"published_at" timestamp,
	"published_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"system" text NOT NULL,
	"school_class_id" text,
	"madrassa_subcategory_id" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"group" text DEFAULT 'general' NOT NULL,
	"total_marks" integer NOT NULL,
	"passing_marks" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_id_exam_sessions_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_subject_id_exam_session_subjects_id_fk" FOREIGN KEY ("exam_subject_id") REFERENCES "public"."exam_session_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_entered_by_user_id_user_id_fk" FOREIGN KEY ("entered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_exam_sessions_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seat_assignments" ADD CONSTRAINT "exam_seat_assignments_seating_plan_id_exam_seating_plans_id_fk" FOREIGN KEY ("seating_plan_id") REFERENCES "public"."exam_seating_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seat_assignments" ADD CONSTRAINT "exam_seat_assignments_exam_id_exam_sessions_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seat_assignments" ADD CONSTRAINT "exam_seat_assignments_hall_id_exam_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."exam_halls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seat_assignments" ADD CONSTRAINT "exam_seat_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seat_assignments" ADD CONSTRAINT "exam_seat_assignments_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seating_plans" ADD CONSTRAINT "exam_seating_plans_exam_id_exam_sessions_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seating_plans" ADD CONSTRAINT "exam_seating_plans_generated_by_user_id_user_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_seating_plans" ADD CONSTRAINT "exam_seating_plans_locked_by_user_id_user_id_fk" FOREIGN KEY ("locked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_session_subjects" ADD CONSTRAINT "exam_session_subjects_exam_id_exam_sessions_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_session_subjects" ADD CONSTRAINT "exam_session_subjects_subject_id_exam_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_published_by_user_id_user_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_halls_system_idx" ON "exam_halls" USING btree ("system");--> statement-breakpoint
CREATE INDEX "exam_halls_active_idx" ON "exam_halls" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_marks_subject_student_idx" ON "exam_marks" USING btree ("exam_subject_id","student_id","enrollment_id");--> statement-breakpoint
CREATE INDEX "exam_marks_exam_idx" ON "exam_marks" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_marks_student_idx" ON "exam_marks" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "exam_marks_enrollment_idx" ON "exam_marks" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "exam_marks_status_idx" ON "exam_marks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_results_exam_student_idx" ON "exam_results" USING btree ("exam_id","student_id","enrollment_id");--> statement-breakpoint
CREATE INDEX "exam_results_exam_idx" ON "exam_results" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_results_student_idx" ON "exam_results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "exam_results_enrollment_idx" ON "exam_results" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "exam_results_status_idx" ON "exam_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exam_results_position_idx" ON "exam_results" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_seat_assignments_plan_hall_seat_idx" ON "exam_seat_assignments" USING btree ("seating_plan_id","hall_id","row_no","col_no");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_seat_assignments_plan_student_idx" ON "exam_seat_assignments" USING btree ("seating_plan_id","student_id","enrollment_id");--> statement-breakpoint
CREATE INDEX "exam_seat_assignments_exam_idx" ON "exam_seat_assignments" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_seat_assignments_hall_idx" ON "exam_seat_assignments" USING btree ("hall_id");--> statement-breakpoint
CREATE INDEX "exam_seat_assignments_student_idx" ON "exam_seat_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_seating_plans_exam_version_idx" ON "exam_seating_plans" USING btree ("exam_id","version");--> statement-breakpoint
CREATE INDEX "exam_seating_plans_exam_idx" ON "exam_seating_plans" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_seating_plans_status_idx" ON "exam_seating_plans" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_session_subjects_exam_subject_idx" ON "exam_session_subjects" USING btree ("exam_id","subject_id");--> statement-breakpoint
CREATE INDEX "exam_session_subjects_exam_idx" ON "exam_session_subjects" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_session_subjects_subject_idx" ON "exam_session_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "exam_session_subjects_exam_date_idx" ON "exam_session_subjects" USING btree ("exam_date");--> statement-breakpoint
CREATE INDEX "exam_sessions_system_idx" ON "exam_sessions" USING btree ("system");--> statement-breakpoint
CREATE INDEX "exam_sessions_institution_idx" ON "exam_sessions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_program_idx" ON "exam_sessions" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_school_class_idx" ON "exam_sessions" USING btree ("school_class_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_school_section_idx" ON "exam_sessions" USING btree ("school_section_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_madrassa_category_idx" ON "exam_sessions" USING btree ("madrassa_category_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_madrassa_subcategory_idx" ON "exam_sessions" USING btree ("madrassa_subcategory_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_academic_year_idx" ON "exam_sessions" USING btree ("academic_year");--> statement-breakpoint
CREATE INDEX "exam_sessions_status_idx" ON "exam_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_subjects_system_code_scope_idx" ON "exam_subjects" USING btree ("system","code","school_class_id","madrassa_subcategory_id");--> statement-breakpoint
CREATE INDEX "exam_subjects_system_idx" ON "exam_subjects" USING btree ("system");--> statement-breakpoint
CREATE INDEX "exam_subjects_school_class_idx" ON "exam_subjects" USING btree ("school_class_id");--> statement-breakpoint
CREATE INDEX "exam_subjects_madrassa_subcategory_idx" ON "exam_subjects" USING btree ("madrassa_subcategory_id");--> statement-breakpoint
CREATE INDEX "exam_subjects_active_idx" ON "exam_subjects" USING btree ("active");