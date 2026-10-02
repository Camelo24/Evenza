-- Per-professional unit pricing (people × unit_price) with an explicit currency.
-- The previous flat "budget" column is retained for backward compatibility.
ALTER TABLE "hiring_domains"
  ADD COLUMN "unit_price" INTEGER,
  ADD COLUMN "currency" VARCHAR(10) NOT NULL DEFAULT 'XAF';
