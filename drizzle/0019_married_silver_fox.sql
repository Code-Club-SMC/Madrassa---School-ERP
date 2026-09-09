ALTER TABLE "teacher_profiles" ALTER COLUMN "system_scope" SET DEFAULT 'school';--> statement-breakpoint
DELETE FROM "school_class_sections";--> statement-breakpoint
DELETE FROM "school_classes";--> statement-breakpoint
ALTER TABLE "school_classes" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "school_classes" ADD CONSTRAINT "school_classes_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_classes_institution_idx" ON "school_classes" USING btree ("institution_id");