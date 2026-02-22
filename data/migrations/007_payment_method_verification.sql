-- Add verification tracking to payment methods
ALTER TABLE "paymentmethod" ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;
ALTER TABLE "paymentmethod" ADD COLUMN IF NOT EXISTS setup_intent_id TEXT;

-- Bank accounts start unverified; cards/paypal are auto-verified
UPDATE "paymentmethod" SET verified = false WHERE type = 'us_bank_account';
UPDATE "paymentmethod" SET verified = true WHERE type != 'us_bank_account' AND verified IS NULL;
