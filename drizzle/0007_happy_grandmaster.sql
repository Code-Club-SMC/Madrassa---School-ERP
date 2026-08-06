CREATE TABLE "teacher_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_profile_id" text NOT NULL,
	"system" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_category_id" text,
	"madrassa_subcategory_id" text,
	"subject_id" text,
	"academic_year" text NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"system_scope" text DEFAULT 'both' NOT NULL,
	"gender" text,
	"designation" text NOT NULL,
	"qualification" text,
	"qualification_urdu" text,
	"address" text,
	"joined_at" date NOT NULL,
	"employment_status" text DEFAULT 'active' NOT NULL,
	"base_monthly_salary_paisa" integer DEFAULT 0 NOT NULL,
	"bank_name" text,
	"bank_account" text,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"salary_effective_date" date,
	"salary_notes" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_timetable_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_profile_id" text NOT NULL,
	"assignment_id" text,
	"system" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_category_id" text,
	"madrassa_subcategory_id" text,
	"subject_id" text,
	"academic_year" text NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_profile_id_teacher_profiles_id_fk" FOREIGN KEY ("teacher_profile_id") REFERENCES "public"."teacher_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_exam_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_teacher_profile_id_teacher_profiles_id_fk" FOREIGN KEY ("teacher_profile_id") REFERENCES "public"."teacher_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_assignment_id_teacher_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."teacher_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timetable_periods" ADD CONSTRAINT "teacher_timetable_periods_subject_id_exam_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teacher_assignments_teacher_idx" ON "teacher_assignments" USING btree ("teacher_profile_id");--> statement-breakpoint
CREATE INDEX "teacher_assignments_system_idx" ON "teacher_assignments" USING btree ("system");--> statement-breakpoint
CREATE INDEX "teacher_assignments_school_idx" ON "teacher_assignments" USING btree ("school_class_id","school_section_id");--> statement-breakpoint
CREATE INDEX "teacher_assignments_madrassa_idx" ON "teacher_assignments" USING btree ("madrassa_category_id","madrassa_subcategory_id");--> statement-breakpoint
CREATE INDEX "teacher_assignments_subject_idx" ON "teacher_assignments" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "teacher_assignments_active_idx" ON "teacher_assignments" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_profiles_user_idx" ON "teacher_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teacher_profiles_status_idx" ON "teacher_profiles" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "teacher_profiles_system_scope_idx" ON "teacher_profiles" USING btree ("system_scope");--> statement-breakpoint
CREATE INDEX "teacher_timetable_teacher_idx" ON "teacher_timetable_periods" USING btree ("teacher_profile_id");--> statement-breakpoint
CREATE INDEX "teacher_timetable_assignment_idx" ON "teacher_timetable_periods" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "teacher_timetable_weekday_idx" ON "teacher_timetable_periods" USING btree ("weekday");--> statement-breakpoint
CREATE INDEX "teacher_timetable_school_idx" ON "teacher_timetable_periods" USING btree ("school_class_id","school_section_id");--> statement-breakpoint
CREATE INDEX "teacher_timetable_madrassa_idx" ON "teacher_timetable_periods" USING btree ("madrassa_category_id","madrassa_subcategory_id");--> statement-breakpoint
CREATE INDEX "teacher_timetable_active_idx" ON "teacher_timetable_periods" USING btree ("active");