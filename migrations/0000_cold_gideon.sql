CREATE TABLE "business_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"company_name" varchar NOT NULL,
	"industry" varchar,
	"description" text,
	"website" varchar,
	"logo" varchar,
	"location" varchar,
	"phone" varchar,
	"email" varchar,
	"services" text[],
	"membership_tier_id" integer,
	"stripe_subscription_id" varchar,
	"is_active" boolean DEFAULT true,
	"networking_goals" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"goal" numeric(10, 2) NOT NULL,
	"current_amount" numeric(10, 2) DEFAULT '0',
	"image" varchar,
	"additional_images" text[],
	"video" varchar,
	"is_active" boolean DEFAULT true,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"end_date" timestamp,
	"slug" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_creators" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"profile_url" varchar NOT NULL,
	"content" text NOT NULL,
	"audience" varchar,
	"subscriber_count" integer,
	"bio" text,
	"is_sponsored" boolean DEFAULT false,
	"sponsorship_start_date" timestamp,
	"sponsorship_end_date" timestamp,
	"sponsorship_amount" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"campaign_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"stripe_payment_id" varchar,
	"message" text,
	"is_anonymous" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"description" text,
	"stripe_price_id" varchar,
	"features" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"post_url" varchar NOT NULL,
	"post_title" varchar,
	"post_description" text,
	"thumbnail_url" varchar,
	"video_url" varchar,
	"platform" varchar NOT NULL,
	"view_count" integer,
	"like_count" integer,
	"comment_count" integer,
	"posted_at" timestamp,
	"is_sponsored" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsorship_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"platforms" jsonb NOT NULL,
	"content" text NOT NULL,
	"audience" varchar,
	"message" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"stripe_customer_id" varchar,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"bio" text,
	"location" varchar,
	"phone" varchar,
	"username" varchar(50),
	"password" varchar,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_membership_tier_id_membership_tiers_id_fk" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_creators" ADD CONSTRAINT "content_creators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_creator_id_content_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."content_creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_applications" ADD CONSTRAINT "sponsorship_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_idx" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");