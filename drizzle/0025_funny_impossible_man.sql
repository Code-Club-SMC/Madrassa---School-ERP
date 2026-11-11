CREATE TABLE "admission_interviews" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"applicant_name" text,
	"applicant_name_urdu" text,
	"ref_no" text,
	"system" text,
	"category_or_class" text,
	"source" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"interviewer" text NOT NULL,
	"room" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"marks" integer,
	"notes" text,
	"guardian_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" text PRIMARY KEY NOT NULL,
	"receipt_no" text NOT NULL,
	"date" text NOT NULL,
	"donor" text NOT NULL,
	"donor_urdu" text,
	"phone" text,
	"cnic" text,
	"type" text NOT NULL,
	"purpose" text NOT NULL,
	"amount_paisa" integer NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_receipt_no_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"type" text DEFAULT 'purchased' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD COLUMN "marks_entry_end_date" date;--> statement-breakpoint
CREATE INDEX "admission_interviews_app_id_idx" ON "admission_interviews" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "admission_interviews_date_idx" ON "admission_interviews" USING btree ("date");--> statement-breakpoint
CREATE INDEX "admission_interviews_status_idx" ON "admission_interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "donations_date_idx" ON "donations" USING btree ("date");--> statement-breakpoint
CREATE INDEX "donations_type_idx" ON "donations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "donations_receipt_no_idx" ON "donations" USING btree ("receipt_no");