-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ChargeResult" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "creditsPerMonth" INTEGER NOT NULL,
    "rolloverMonths" INTEGER NOT NULL DEFAULT 0,
    "benefits" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3) NOT NULL,
    "lastChargedAt" TIMESTAMP(3),
    "lastChargeResult" "ChargeResult",
    "retryAttempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetryAttempts" INTEGER NOT NULL DEFAULT 3,
    "retryIntervalHrs" INTEGER NOT NULL DEFAULT 24,
    "graceDays" INTEGER NOT NULL DEFAULT 7,
    "metadata" JSONB,

    CONSTRAINT "membership_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_code_key" ON "membership_plans"("code");

-- CreateIndex
CREATE INDEX "membership_subscriptions_userId_status_idx" ON "membership_subscriptions"("userId", "status");

-- AddForeignKey
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
