CREATE TABLE "school_timetable_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"school_class_id" text NOT NULL,
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
CREATE TABLE "school_timetable_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"subject_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_timetable_periods" ADD CONSTRAINT "school_timetable_periods_school_class_id_school_classes_id_fk" FOREIGN KEY ("school_class_id") REFERENCES "public"."school_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_timetable_slots" ADD CONSTRAINT "school_timetable_slots_period_id_school_timetable_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."school_timetable_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_timetable_slots" ADD CONSTRAINT "school_timetable_slots_subject_id_exam_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_timetable_periods_class_idx" ON "school_timetable_periods" USING btree ("school_class_id");--> statement-breakpoint
CREATE INDEX "school_timetable_periods_display_order_idx" ON "school_timetable_periods" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "school_timetable_slots_period_day_idx" ON "school_timetable_slots" USING btree ("period_id","day_of_week");--> statement-breakpoint
CREATE INDEX "school_timetable_slots_period_idx" ON "school_timetable_slots" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "school_timetable_slots_subject_idx" ON "school_timetable_slots" USING btree ("subject_id");