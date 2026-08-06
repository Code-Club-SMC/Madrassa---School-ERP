CREATE TABLE "notification_events" (
	"id" text PRIMARY KEY NOT NULL,
	"audience" text NOT NULL,
	"category" text NOT NULL,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"status" text DEFAULT 'recorded' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"student_id" text,
	"guardian_id" text,
	"user_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reads_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_event_id_notification_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."notification_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_events_audience_idx" ON "notification_events" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "notification_events_category_idx" ON "notification_events" USING btree ("category");--> statement-breakpoint
CREATE INDEX "notification_events_status_idx" ON "notification_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_events_student_idx" ON "notification_events" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "notification_events_guardian_idx" ON "notification_events" USING btree ("guardian_id");--> statement-breakpoint
CREATE INDEX "notification_events_user_idx" ON "notification_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_events_created_idx" ON "notification_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_reads_user_idx" ON "notification_reads" USING btree ("user_id");