ALTER TABLE "events" ADD COLUMN "ends_at" TIMESTAMP(3);
UPDATE "events" SET "ends_at" = "starts_at" + INTERVAL '4 hours' WHERE "ends_at" IS NULL;
ALTER TABLE "events" ALTER COLUMN "ends_at" SET NOT NULL;

CREATE TABLE "event_ticket_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "price" INTEGER NOT NULL CHECK ("price" >= 0),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_ticket_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "event_ticket_types_event_name_idx" UNIQUE ("event_id", "name")
);

INSERT INTO "event_ticket_types" ("event_id", "name", "price")
SELECT "id", 'General admission', "ticket_price"
FROM "events"
WHERE "visibility" = 'public' AND "ticket_price" IS NOT NULL;

ALTER TABLE "tickets" ADD COLUMN "ticket_type_id" UUID;
ALTER TABLE "tickets" ADD COLUMN "ticket_type_name" VARCHAR(100);
