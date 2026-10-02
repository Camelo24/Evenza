ALTER TABLE "events"
ADD COLUMN "service_category_id" INTEGER;

CREATE TABLE "event_vendor_applications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_vendor_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_vendor_applications_event_vendor_idx"
ON "event_vendor_applications"("event_id", "vendor_id");
