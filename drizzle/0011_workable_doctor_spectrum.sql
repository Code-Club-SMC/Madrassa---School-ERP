DROP INDEX "academic_years_one_active_idx";--> statement-breakpoint
ALTER TABLE "academic_years" ADD COLUMN "system" text DEFAULT 'school' NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_years" ADD COLUMN "calendar_type" text DEFAULT 'gregorian' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_one_active_per_system_idx" ON "academic_years" USING btree ("system","status") WHERE "academic_years"."status" = 'active';--> statement-breakpoint
CREATE INDEX "academic_years_system_idx" ON "academic_years" USING btree ("system");