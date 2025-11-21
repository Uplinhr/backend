-- AlterTable
ALTER TABLE "membership_plans" ADD COLUMN     "mpProductId" TEXT,
ADD COLUMN     "paypalPlanId" TEXT;

-- AlterTable
ALTER TABLE "membership_subscriptions" ADD COLUMN     "externalCustomerId" TEXT,
ADD COLUMN     "externalSubscriptionId" TEXT,
ADD COLUMN     "lastExternalChargeId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT;
