CREATE TABLE "madrassa_timetable_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"madrassa_subcategory_id" text NOT NULL,
	"time_start" text NOT NULL,
	"time_end" text NOT NULL,
	"label" text NOT NULL,
	"label_urdu" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_break" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "madrassa_timetable_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"subject_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "madrassa_timetable_periods" ADD CONSTRAINT "madrassa_timetable_periods_madrassa_subcategory_id_madrassa_subcategories_id_fk" FOREIGN KEY ("madrassa_subcategory_id") REFERENCES "public"."madrassa_subcategories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "madrassa_timetable_slots" ADD CONSTRAINT "madrassa_timetable_slots_period_id_madrassa_timetable_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."madrassa_timetable_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "madrassa_timetable_slots" ADD CONSTRAINT "madrassa_timetable_slots_subject_id_exam_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "madrassa_timetable_periods_subcategory_idx" ON "madrassa_timetable_periods" USING btree ("madrassa_subcategory_id");--> statement-breakpoint
CREATE INDEX "madrassa_timetable_periods_display_order_idx" ON "madrassa_timetable_periods" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "madrassa_timetable_slots_period_day_idx" ON "madrassa_timetable_slots" USING btree ("period_id","day_of_week");--> statement-breakpoint
CREATE INDEX "madrassa_timetable_slots_period_idx" ON "madrassa_timetable_slots" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "madrassa_timetable_slots_subject_idx" ON "madrassa_timetable_slots" USING btree ("subject_id");