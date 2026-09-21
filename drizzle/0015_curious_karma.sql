CREATE TABLE IF NOT EXISTS "school_timetable_periods" (
  "id" text PRIMARY KEY,
  "school_class_id" text NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  "time_start" text NOT NULL,
  "time_end" text NOT NULL,
  "label" text NOT NULL,
  "label_urdu" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_break" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "school_timetable_slots" (
  "id" text PRIMARY KEY,
  "period_id" text NOT NULL REFERENCES school_timetable_periods(id) ON DELETE CASCADE,
  "day_of_week" integer NOT NULL,
  "subject_id" text REFERENCES exam_subjects(id) ON DELETE RESTRICT,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "school_timetable_slots_period_day_idx" ON "school_timetable_slots" ("period_id", "day_of_week");
CREATE INDEX IF NOT EXISTS "school_timetable_periods_class_idx" ON "school_timetable_periods" ("school_class_id");
CREATE INDEX IF NOT EXISTS "school_timetable_periods_display_order_idx" ON "school_timetable_periods" ("display_order");
CREATE INDEX IF NOT EXISTS "school_timetable_slots_period_idx" ON "school_timetable_slots" ("period_id");
CREATE INDEX IF NOT EXISTS "school_timetable_slots_subject_idx" ON "school_timetable_slots" ("subject_id");
