-- CreateEnum
CREATE TYPE "RequestCategory" AS ENUM ('HOUSING', 'ENERGY', 'WATER', 'FOOD', 'EDUCATION', 'TRANSPORT', 'HEALTHCARE', 'FAMILY_EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'PARTIALLY_FUNDED', 'FULLY_FUNDED', 'PAYMENT_PROCESSING', 'PAID_TO_CREDITOR', 'CLOSED', 'REJECTED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestDisplayMode" AS ENUM ('ANONYMOUS', 'DISPLAY_NAME');

-- CreateTable
CREATE TABLE "AssistanceRequest" (
    "id" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "RequestCategory" NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "amountRequestedMinor" INTEGER NOT NULL,
    "amountFundedMinor" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "displayMode" "RequestDisplayMode" NOT NULL DEFAULT 'ANONYMOUS',
    "publicDisplayName" TEXT,
    "publicConsentAt" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "lastDecisionNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatusChange" (
    "id" BIGSERIAL NOT NULL,
    "requestId" UUID NOT NULL,
    "fromStatus" "RequestStatus",
    "toStatus" "RequestStatus" NOT NULL,
    "actorId" UUID,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistanceRequest_status_countryCode_category_idx" ON "AssistanceRequest"("status", "countryCode", "category");

-- CreateIndex
CREATE INDEX "AssistanceRequest_applicantId_idx" ON "AssistanceRequest"("applicantId");

-- CreateIndex
CREATE INDEX "RequestStatusChange_requestId_idx" ON "RequestStatusChange"("requestId");

-- AddForeignKey
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT "AssistanceRequest_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusChange" ADD CONSTRAINT "RequestStatusChange_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AssistanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---- Safety rules enforced by the database itself (hand-written) ----------

-- 1. Money amounts are positive whole minor units, and funding can never exceed the request.
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT request_amounts_valid CHECK (
  "amountRequestedMinor" > 0
  AND "amountFundedMinor" >= 0
  AND "amountFundedMinor" <= "amountRequestedMinor"
);

-- 2. Requests are never public without the applicant's explicit consent.
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT request_public_requires_consent CHECK (
  "status" NOT IN ('PUBLISHED', 'PARTIALLY_FUNDED', 'FULLY_FUNDED', 'PAYMENT_PROCESSING', 'PAID_TO_CREDITOR')
  OR "publicConsentAt" IS NOT NULL
);

-- 3. Showing a display name requires one.
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT request_display_name_present CHECK (
  "displayMode" = 'ANONYMOUS' OR ("publicDisplayName" IS NOT NULL AND length(trim("publicDisplayName")) > 0)
);

-- 4. Currency codes are three upper-case letters.
ALTER TABLE "AssistanceRequest" ADD CONSTRAINT request_currency_format CHECK ("currency" ~ '^[A-Z]{3}$');

-- 5. Status history rows can never be edited. (Deletion only happens together
--    with the request itself, for example on a lawful erasure request.)
CREATE OR REPLACE FUNCTION request_status_change_block_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'RequestStatusChange rows cannot be edited';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER request_status_change_no_update
  BEFORE UPDATE ON "RequestStatusChange"
  FOR EACH ROW EXECUTE FUNCTION request_status_change_block_update();
