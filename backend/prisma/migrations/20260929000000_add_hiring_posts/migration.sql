CREATE TYPE "hiring_post_status" AS ENUM ('open', 'closed');
CREATE TYPE "hiring_domain_status" AS ENUM ('open', 'closed');
CREATE TYPE "hiring_application_status" AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE "interview_status" AS ENUM ('scheduled', 'completed', 'cancelled');

CREATE TABLE "hiring_posts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL,
  "organiser_id" UUID NOT NULL,
  "deadline" TIMESTAMP(3) NOT NULL,
  "status" "hiring_post_status" NOT NULL DEFAULT 'open',
  "closed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hiring_posts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hiring_posts_event_id_idx" ON "hiring_posts"("event_id");
CREATE INDEX "hiring_posts_deadline_status_idx" ON "hiring_posts"("deadline", "status");

CREATE TABLE "hiring_domains" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "hiring_post_id" UUID NOT NULL REFERENCES "hiring_posts"("id") ON DELETE CASCADE,
  "category_id" INTEGER NOT NULL,
  "places_needed" INTEGER NOT NULL CHECK ("places_needed" > 0),
  "places_filled" INTEGER NOT NULL DEFAULT 0 CHECK ("places_filled" >= 0),
  "status" "hiring_domain_status" NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hiring_domains_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hiring_domains_post_category_idx" UNIQUE ("hiring_post_id", "category_id")
);

CREATE TABLE "hiring_applications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "hiring_post_id" UUID NOT NULL REFERENCES "hiring_posts"("id") ON DELETE CASCADE,
  "hiring_domain_id" UUID NOT NULL REFERENCES "hiring_domains"("id") ON DELETE CASCADE,
  "vendor_id" UUID NOT NULL,
  "status" "hiring_application_status" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hiring_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hiring_applications_domain_vendor_idx" UNIQUE ("hiring_domain_id", "vendor_id")
);

CREATE TABLE "interviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "hiring_application_id" UUID NOT NULL REFERENCES "hiring_applications"("id") ON DELETE CASCADE,
  "organiser_id" UUID NOT NULL,
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "meeting_url" TEXT NOT NULL,
  "status" "interview_status" NOT NULL DEFAULT 'scheduled',
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "interviews_application_idx" UNIQUE ("hiring_application_id")
);
