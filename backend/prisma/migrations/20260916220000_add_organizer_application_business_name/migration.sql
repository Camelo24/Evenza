ALTER TABLE "organizer_applications"
  ADD COLUMN IF NOT EXISTS "business_name" varchar(180);

-- Existing submissions stored their business name inside the free-form message.
-- Keep those records reviewable while new submissions use the dedicated column.
UPDATE "organizer_applications"
SET "business_name" = COALESCE(
  NULLIF(split_part("message", E'\n', 1), ''),
  'Not provided'
)
WHERE "business_name" IS NULL;

ALTER TABLE "organizer_applications"
  ALTER COLUMN "business_name" SET NOT NULL;
