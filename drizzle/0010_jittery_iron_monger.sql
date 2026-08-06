CREATE TABLE "academic_years" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hijri_name" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"carry_forward_enabled" boolean DEFAULT true NOT NULL,
	"locked_at" timestamp,
	"locked_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"system" text NOT NULL,
	"institution_id" text,
	"program_id" text,
	"source_school_class_id" text,
	"source_school_section_id" text,
	"source_madrassa_category_id" text,
	"source_madrassa_subcategory_id" text,
	"source_darja" text,
	"target_school_class_id" text,
	"target_school_section_id" text,
	"target_madrassa_category_id" text,
	"target_madrassa_subcategory_id" text,
	"target_darja" text,
	"outcome" text DEFAULT 'promote' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_run_items" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"student_id" text NOT NULL,
	"source_enrollment_id" text NOT NULL,
	"target_enrollment_id" text,
	"outcome" text NOT NULL,
	"status" text DEFAULT 'ready' NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blockers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"carry_forward_amount_paisa" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_academic_year_id" text NOT NULL,
	"target_academic_year_id" text NOT NULL,
	"system" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"carry_forward_fees" boolean DEFAULT true NOT NULL,
	"include_teacher_rollover" boolean DEFAULT false NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" text,
	"applied_at" timestamp,
	"applied_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD COLUMN "academic_year_id" text;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_locked_by_user_id_user_id_fk" FOREIGN KEY ("locked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_source_school_class_id_school_classes_id_fk" FOREIGN KEY ("source_school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_source_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("source_school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_source_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("source_madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_source_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("source_madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_target_school_class_id_school_classes_id_fk" FOREIGN KEY ("target_school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_target_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("target_school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_target_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("target_madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_target_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("target_madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_run_items" ADD CONSTRAINT "promotion_run_items_run_id_promotion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."promotion_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_run_items" ADD CONSTRAINT "promotion_run_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_run_items" ADD CONSTRAINT "promotion_run_items_source_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("source_enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_run_items" ADD CONSTRAINT "promotion_run_items_target_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("target_enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_runs" ADD CONSTRAINT "promotion_runs_source_academic_year_id_academic_years_id_fk" FOREIGN KEY ("source_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_runs" ADD CONSTRAINT "promotion_runs_target_academic_year_id_academic_years_id_fk" FOREIGN KEY ("target_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_runs" ADD CONSTRAINT "promotion_runs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_runs" ADD CONSTRAINT "promotion_runs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_runs" ADD CONSTRAINT "promotion_runs_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_runs" ADD CONSTRAINT "promotion_runs_applied_by_user_id_user_id_fk" FOREIGN KEY ("applied_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_one_active_idx" ON "academic_years" USING btree ("status") WHERE "academic_years"."status" = 'active';--> statement-breakpoint
CREATE INDEX "academic_years_status_idx" ON "academic_years" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotion_rules_system_idx" ON "promotion_rules" USING btree ("system");--> statement-breakpoint
CREATE INDEX "promotion_rules_institution_idx" ON "promotion_rules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "promotion_rules_program_idx" ON "promotion_rules" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "promotion_rules_source_school_idx" ON "promotion_rules" USING btree ("source_school_class_id","source_school_section_id");--> statement-breakpoint
CREATE INDEX "promotion_rules_source_madrassa_idx" ON "promotion_rules" USING btree ("source_madrassa_category_id","source_madrassa_subcategory_id","source_darja");--> statement-breakpoint
CREATE INDEX "promotion_rules_active_idx" ON "promotion_rules" USING btree ("active");--> statement-breakpoint
CREATE INDEX "promotion_rules_display_order_idx" ON "promotion_rules" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "promotion_run_items_run_idx" ON "promotion_run_items" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "promotion_run_items_student_idx" ON "promotion_run_items" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "promotion_run_items_source_enrollment_idx" ON "promotion_run_items" USING btree ("source_enrollment_id");--> statement-breakpoint
CREATE INDEX "promotion_run_items_target_enrollment_idx" ON "promotion_run_items" USING btree ("target_enrollment_id");--> statement-breakpoint
CREATE INDEX "promotion_run_items_outcome_idx" ON "promotion_run_items" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "promotion_run_items_status_idx" ON "promotion_run_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotion_runs_source_year_idx" ON "promotion_runs" USING btree ("source_academic_year_id");--> statement-breakpoint
CREATE INDEX "promotion_runs_target_year_idx" ON "promotion_runs" USING btree ("target_academic_year_id");--> statement-breakpoint
CREATE INDEX "promotion_runs_system_idx" ON "promotion_runs" USING btree ("system");--> statement-breakpoint
CREATE INDEX "promotion_runs_institution_idx" ON "promotion_runs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "promotion_runs_program_idx" ON "promotion_runs" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "promotion_runs_status_idx" ON "promotion_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotion_runs_created_by_idx" ON "promotion_runs" USING btree ("created_by_user_id");--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_enrollments_academic_year_idx" ON "student_enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "student_enrollments_student_academic_year_idx" ON "student_enrollments" USING btree ("student_id","academic_year_id");