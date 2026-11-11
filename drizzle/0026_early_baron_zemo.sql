CREATE TABLE "finance_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"voucher_no" text NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"category_urdu" text,
	"amount" integer NOT NULL,
	"system" text DEFAULT 'both' NOT NULL,
	"institution_id" text,
	"description" text,
	"description_urdu" text,
	"party_name" text,
	"party_role" text,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"reference" text,
	"status" text DEFAULT 'posted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "finance_transactions_date_idx" ON "finance_transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "finance_transactions_type_idx" ON "finance_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "finance_transactions_system_idx" ON "finance_transactions" USING btree ("system");--> statement-breakpoint
CREATE INDEX "finance_transactions_institution_idx" ON "finance_transactions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "finance_transactions_category_idx" ON "finance_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "finance_transactions_voucher_idx" ON "finance_transactions" USING btree ("voucher_no");