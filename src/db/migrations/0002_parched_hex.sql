CREATE TYPE "public"."investment_account_kind" AS ENUM('bank', 'platform');--> statement-breakpoint
CREATE TYPE "public"."investment_movement_type" AS ENUM('contribution', 'withdrawal', 'interest', 'fee');--> statement-breakpoint
CREATE TABLE "investment_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution" text NOT NULL,
	"kind" "investment_account_kind" DEFAULT 'bank' NOT NULL,
	"name" text NOT NULL,
	"currency" text DEFAULT 'CLP' NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"type" "investment_movement_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"fx_rate" numeric(18, 6) DEFAULT '1' NOT NULL,
	"date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"fx_rate" numeric(18, 6) DEFAULT '1' NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investment_valuations_account_date_key" UNIQUE("account_id","date")
);
--> statement-breakpoint
ALTER TABLE "investment_accounts" ADD CONSTRAINT "investment_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_movements" ADD CONSTRAINT "investment_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_movements" ADD CONSTRAINT "investment_movements_account_id_investment_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."investment_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_valuations" ADD CONSTRAINT "investment_valuations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_valuations" ADD CONSTRAINT "investment_valuations_account_id_investment_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."investment_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "investment_accounts_user_id_idx" ON "investment_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "investment_movements_user_date_idx" ON "investment_movements" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "investment_movements_account_date_idx" ON "investment_movements" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "investment_valuations_account_date_idx" ON "investment_valuations" USING btree ("account_id","date");