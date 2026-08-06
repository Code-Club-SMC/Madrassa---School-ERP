CREATE TABLE "student_events" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text,
	"type" text NOT NULL,
	"message" text,
	"metadata" jsonb,
	"actor_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_events" ADD CONSTRAINT "student_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_events" ADD CONSTRAINT "student_events_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_events" ADD CONSTRAINT "student_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_events_student_idx" ON "student_events" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_events_enrollment_idx" ON "student_events" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "student_events_type_idx" ON "student_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "student_events_created_idx" ON "student_events" USING btree ("created_at");