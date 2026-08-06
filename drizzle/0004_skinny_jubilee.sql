CREATE TABLE "fee_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"charge_id" text,
	"payment_id" text,
	"type" text NOT NULL,
	"amount_paisa" integer NOT NULL,
	"method" text,
	"reason" text NOT NULL,
	"actor_user_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_charges" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"school_class_id" text,
	"school_section_id" text,
	"madrassa_subcategory_id" text,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"period" text,
	"amount_paisa" integer NOT NULL,
	"due_date" timestamp,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" text,
	"reversed_at" timestamp,
	"reversed_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_payment_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"charge_id" text NOT NULL,
	"amount_paisa" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"receipt_no" text NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"amount_paisa" integer NOT NULL,
	"method" text NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"received_by_user_id" text,
	"payer_name" text,
	"payer_phone" text,
	"status" text DEFAULT 'posted' NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reversed_at" timestamp,
	"reversed_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fee_payments_receipt_no_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "finance_number_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"type" text NOT NULL,
	"institution_id" text NOT NULL,
	"prefix" text NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fee_adjustments" ADD CONSTRAINT "fee_adjustments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_adjustments" ADD CONSTRAINT "fee_adjustments_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_adjustments" ADD CONSTRAINT "fee_adjustments_charge_id_fee_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."fee_charges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_adjustments" ADD CONSTRAINT "fee_adjustments_payment_id_fee_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."fee_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_adjustments" ADD CONSTRAINT "fee_adjustments_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_school_section_id_school_class_sections_id_fk" FOREIGN KEY ("school_section_id") REFERENCES "public"."school_class_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_reversed_by_user_id_user_id_fk" FOREIGN KEY ("reversed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_payment_id_fee_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."fee_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_charge_id_fee_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."fee_charges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_received_by_user_id_user_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_reversed_by_user_id_user_id_fk" FOREIGN KEY ("reversed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_number_sequences" ADD CONSTRAINT "finance_number_sequences_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fee_adjustments_student_idx" ON "fee_adjustments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fee_adjustments_enrollment_idx" ON "fee_adjustments" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "fee_adjustments_charge_idx" ON "fee_adjustments" USING btree ("charge_id");--> statement-breakpoint
CREATE INDEX "fee_adjustments_payment_idx" ON "fee_adjustments" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "fee_adjustments_type_idx" ON "fee_adjustments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "fee_adjustments_created_idx" ON "fee_adjustments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "fee_charges_student_idx" ON "fee_charges" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fee_charges_enrollment_idx" ON "fee_charges" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "fee_charges_institution_idx" ON "fee_charges" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_charges_program_idx" ON "fee_charges" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "fee_charges_status_idx" ON "fee_charges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fee_charges_due_date_idx" ON "fee_charges" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "fee_allocations_payment_idx" ON "fee_payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "fee_allocations_charge_idx" ON "fee_payment_allocations" USING btree ("charge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_allocations_payment_charge_idx" ON "fee_payment_allocations" USING btree ("payment_id","charge_id");--> statement-breakpoint
CREATE INDEX "fee_payments_student_idx" ON "fee_payments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fee_payments_enrollment_idx" ON "fee_payments" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "fee_payments_institution_idx" ON "fee_payments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "fee_payments_received_idx" ON "fee_payments" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "fee_payments_status_idx" ON "fee_payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_number_sequences_scope_idx" ON "finance_number_sequences" USING btree ("year","type","institution_id");