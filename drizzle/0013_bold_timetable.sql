CREATE TABLE IF NOT EXISTS "madrassa_timetable_periods" (
  "id" text PRIMARY KEY NOT NULL,
  "madrassa_subcategory_id" text NOT NULL REFERENCES "madrassa_subcategories"("id") ON DELETE CASCADE,
  "time_start" text NOT NULL,
  "time_end" text NOT NULL,
  "label" text NOT NULL,
  "label_urdu" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_break" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "madrassa_timetable_slots" (
  "id" text PRIMARY KEY NOT NULL,
  "period_id" text NOT NULL REFERENCES "madrassa_timetable_periods"("id") ON DELETE CASCADE,
  "day_of_week" integer NOT NULL,
  "subject_id" text REFERENCES "exam_subjects"("id") ON DELETE RESTRICT,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "madrassa_timetable_slots_period_day_idx" ON "madrassa_timetable_slots" ("period_id", "day_of_week");
CREATE INDEX IF NOT EXISTS "madrassa_timetable_periods_subcategory_idx" ON "madrassa_timetable_periods" ("madrassa_subcategory_id");
CREATE INDEX IF NOT EXISTS "madrassa_timetable_slots_period_idx" ON "madrassa_timetable_slots" ("period_id");
CREATE INDEX IF NOT EXISTS "madrassa_timetable_slots_subject_idx" ON "madrassa_timetable_slots" ("subject_id");
