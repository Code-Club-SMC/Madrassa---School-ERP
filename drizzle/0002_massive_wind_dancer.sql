CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"system" text NOT NULL,
	"section" text,
	"is_formal" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "madrassa_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"description" text NOT NULL,
	"description_urdu" text NOT NULL,
	"display_order" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "madrassa_subcategories" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"roll_prefix" text NOT NULL,
	"darja" text,
	"govt_equivalent" text,
	"duration_years" integer,
	"display_order" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"system" text NOT NULL,
	"kind" text NOT NULL,
	"roll_prefix" text NOT NULL,
	"is_formal" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_class_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"name" text NOT NULL,
	"group" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_classes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"level" text NOT NULL,
	"govt_equivalent" text,
	"display_order" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"ref_no" text NOT NULL,
	"source" text NOT NULL,
	"variant_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"father_name" text NOT NULL,
	"father_name_urdu" text,
	"gender" text NOT NULL,
	"dob" timestamp,
	"cnic_b_form" text,
	"guardian_name" text NOT NULL,
	"guardian_name_urdu" text,
	"guardian_phone" text,
	"guardian_cnic" text,
	"guardian_email" text,
	"guardian_relation" text DEFAULT 'father' NOT NULL,
	"address" text,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_subcategory_id" text,
	"darja" text,
	"form_data" jsonb NOT NULL,
	"photo_path" text,
	"accepted_student_id" text,
	"accepted_enrollment_id" text,
	"matched_guardian_id" text,
	"assigned_to_user_id" text,
	"reviewed_by_user_id" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admission_applications_ref_no_unique" UNIQUE("ref_no")
);
--> statement-breakpoint
CREATE TABLE "admission_events" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"message" text,
	"metadata" jsonb,
	"actor_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "number_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"type" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text,
	"school_class_id" text,
	"madrassa_subcategory_id" text,
	"prefix" text NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"name_urdu" text,
	"cnic" text,
	"phone" text,
	"email" text,
	"address" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_subcategory_id" text,
	"darja" text,
	"admission_no" text NOT NULL,
	"roll_no" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_guardians" (
	"student_id" text NOT NULL,
	"guardian_id" text NOT NULL,
	"relation" text NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_guardians_student_id_guardian_id_pk" PRIMARY KEY("student_id","guardian_id")
);
--> statement-breakpoint
CREATE TABLE "student_siblings" (
	"student_id" text NOT NULL,
	"sibling_id" text NOT NULL,
	"confirmed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_siblings_student_id_sibling_id_pk" PRIMARY KEY("student_id","sibling_id")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"father_name" text NOT NULL,
	"father_name_urdu" text,
	"gender" text NOT NULL,
	"dob" timestamp,
	"cnic_b_form" text,
	"status" text DEFAULT 'active' NOT NULL,
	"photo_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "madrassa_subcategories" ADD CONSTRAINT "madrassa_subcategories_category_id_madrassa_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."madrassa_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_class_sections" ADD CONSTRAINT "school_class_sections_class_id_school_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."school_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_accepted_student_id_students_id_fk" FOREIGN KEY ("accepted_student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_accepted_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("accepted_enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_matched_guardian_id_guardians_id_fk" FOREIGN KEY ("matched_guardian_id") REFERENCES "public"."guardians"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_assigned_to_user_id_user_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_events" ADD CONSTRAINT "admission_events_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_events" ADD CONSTRAINT "admission_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_siblings" ADD CONSTRAINT "student_siblings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_siblings" ADD CONSTRAINT "student_siblings_sibling_id_students_id_fk" FOREIGN KEY ("sibling_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_siblings" ADD CONSTRAINT "student_siblings_confirmed_by_user_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "institutions_system_idx" ON "institutions" USING btree ("system");--> statement-breakpoint
CREATE INDEX "institutions_active_idx" ON "institutions" USING btree ("active");--> statement-breakpoint
CREATE INDEX "madrassa_categories_active_idx" ON "madrassa_categories" USING btree ("active");--> statement-breakpoint
CREATE INDEX "madrassa_subcategories_category_idx" ON "madrassa_subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "madrassa_subcategories_darja_idx" ON "madrassa_subcategories" USING btree ("darja");--> statement-breakpoint
CREATE INDEX "madrassa_subcategories_active_idx" ON "madrassa_subcategories" USING btree ("active");--> statement-breakpoint
CREATE INDEX "programs_institution_idx" ON "programs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "programs_system_idx" ON "programs" USING btree ("system");--> statement-breakpoint
CREATE INDEX "programs_active_idx" ON "programs" USING btree ("active");--> statement-breakpoint
CREATE INDEX "school_class_sections_class_idx" ON "school_class_sections" USING btree ("class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_class_sections_class_name_idx" ON "school_class_sections" USING btree ("class_id","name");--> statement-breakpoint
CREATE INDEX "school_classes_level_idx" ON "school_classes" USING btree ("level");--> statement-breakpoint
CREATE INDEX "school_classes_active_idx" ON "school_classes" USING btree ("active");--> statement-breakpoint
CREATE INDEX "admission_applications_status_idx" ON "admission_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admission_applications_variant_idx" ON "admission_applications" USING btree ("variant_key");--> statement-breakpoint
CREATE INDEX "admission_applications_program_idx" ON "admission_applications" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "admission_applications_guardian_phone_idx" ON "admission_applications" USING btree ("guardian_phone");--> statement-breakpoint
CREATE INDEX "admission_applications_guardian_cnic_idx" ON "admission_applications" USING btree ("guardian_cnic");--> statement-breakpoint
CREATE INDEX "admission_applications_submitted_idx" ON "admission_applications" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "admission_events_application_idx" ON "admission_events" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "admission_events_type_idx" ON "admission_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "admission_events_created_idx" ON "admission_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "number_sequences_scope_idx" ON "number_sequences" USING btree ("year","type","institution_id","program_id","school_class_id","madrassa_subcategory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guardians_cnic_unique_idx" ON "guardians" USING btree ("cnic");--> statement-breakpoint
CREATE INDEX "guardians_phone_idx" ON "guardians" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "guardians_email_idx" ON "guardians" USING btree ("email");--> statement-breakpoint
CREATE INDEX "guardians_user_idx" ON "guardians" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_enrollments_admission_no_idx" ON "student_enrollments" USING btree ("admission_no");--> statement-breakpoint
CREATE UNIQUE INDEX "student_enrollments_roll_no_idx" ON "student_enrollments" USING btree ("roll_no");--> statement-breakpoint
CREATE INDEX "student_enrollments_student_idx" ON "student_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_enrollments_institution_idx" ON "student_enrollments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "student_enrollments_program_idx" ON "student_enrollments" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "student_enrollments_status_idx" ON "student_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "student_guardians_guardian_idx" ON "student_guardians" USING btree ("guardian_id");--> statement-breakpoint
CREATE INDEX "student_siblings_sibling_idx" ON "student_siblings" USING btree ("sibling_id");--> statement-breakpoint
CREATE INDEX "students_name_idx" ON "students" USING btree ("name");--> statement-breakpoint
CREATE INDEX "students_name_urdu_idx" ON "students" USING btree ("name_urdu");--> statement-breakpoint
CREATE INDEX "students_father_name_idx" ON "students" USING btree ("father_name");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "students_cnic_b_form_idx" ON "students" USING btree ("cnic_b_form");