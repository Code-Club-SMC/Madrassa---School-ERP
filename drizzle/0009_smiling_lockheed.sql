ALTER TABLE "notification_events" ADD COLUMN "source" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "publish_at" timestamp;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
CREATE INDEX "notification_events_source_idx" ON "notification_events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "notification_events_publish_idx" ON "notification_events" USING btree ("publish_at");--> statement-breakpoint
CREATE INDEX "notification_events_expires_idx" ON "notification_events" USING btree ("expires_at");