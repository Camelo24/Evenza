-- Extend hiring flow: shortlist status, per-domain requirement/budget,
-- flexible interview meeting (url OR physical location + note).
ALTER TYPE "hiring_application_status" ADD VALUE IF NOT EXISTS 'shortlisted';

ALTER TABLE "hiring_domains"
  ADD COLUMN "requirement_note" TEXT,
  ADD COLUMN "budget" INTEGER;

ALTER TABLE "interviews"
  ADD COLUMN "location" VARCHAR(240),
  ADD COLUMN "note" TEXT;

ALTER TABLE "interviews" ALTER COLUMN "meeting_url" DROP NOT NULL;
