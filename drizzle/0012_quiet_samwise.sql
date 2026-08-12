UPDATE "teacher_assignments" SET "madrassa_category_id" = NULL, "madrassa_subcategory_id" = NULL WHERE "madrassa_category_id" IS NOT NULL OR "madrassa_subcategory_id" IS NOT NULL;--> statement-breakpoint
UPDATE "teacher_timetable_periods" SET "madrassa_category_id" = NULL, "madrassa_subcategory_id" = NULL WHERE "madrassa_category_id" IS NOT NULL OR "madrassa_subcategory_id" IS NOT NULL;--> statement-breakpoint
UPDATE "exam_subjects" SET "madrassa_subcategory_id" = NULL WHERE "madrassa_subcategory_id" IS NOT NULL;--> statement-breakpoint
UPDATE "exam_sessions" SET "madrassa_category_id" = NULL, "madrassa_subcategory_id" = NULL WHERE "madrassa_category_id" IS NOT NULL OR "madrassa_subcategory_id" IS NOT NULL;--> statement-breakpoint
DELETE FROM "madrassa_subcategories";--> statement-breakpoint
DELETE FROM "madrassa_categories";
