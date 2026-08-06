CREATE TABLE "student_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_category_id" text,
	"madrassa_subcategory_id" text,
	"attendance_date" date NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"marked_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_madrassa_category_id_madrassa_categories_id_fk" FOREIGN KEY ("madrassa_category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_marked_by_user_id_user_id_fk" FOREIGN KEY ("marked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "student_attendance_student_enrollment_date_idx" ON "student_attendance" USING btree ("student_id","enrollment_id","attendance_date");--> statement-breakpoint
CREATE INDEX "student_attendance_student_idx" ON "student_attendance" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_attendance_enrollment_idx" ON "student_attendance" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "student_attendance_institution_idx" ON "student_attendance" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "student_attendance_program_idx" ON "student_attendance" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "student_attendance_school_class_idx" ON "student_attendance" USING btree ("school_class_id");--> statement-breakpoint
CREATE INDEX "student_attendance_school_section_idx" ON "student_attendance" USING btree ("school_section_id");--> statement-breakpoint
CREATE INDEX "student_attendance_madrassa_category_idx" ON "student_attendance" USING btree ("madrassa_category_id");--> statement-breakpoint
CREATE INDEX "student_attendance_madrassa_subcategory_idx" ON "student_attendance" USING btree ("madrassa_subcategory_id");--> statement-breakpoint
CREATE INDEX "student_attendance_date_idx" ON "student_attendance" USING btree ("attendance_date");--> statement-breakpoint
CREATE INDEX "student_attendance_status_idx" ON "student_attendance" USING btree ("status");