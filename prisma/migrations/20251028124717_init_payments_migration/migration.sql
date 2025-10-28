-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'initiated', 'completed', 'failed', 'cancelled', 'refunded', 'captured');

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "id_usuario" TEXT,
    "id_cart" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "payment_gateway" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION,
    "discount_amount" DOUBLE PRECISION,
    "total_amount" DOUBLE PRECISION,
    "country_code" TEXT,
    "tax_rate" DOUBLE PRECISION,
    "tax_name" TEXT,
    "payment_method" TEXT,
    "external_payment_id" TEXT,
    "payment_url" TEXT,
    "expires_at" TIMESTAMP(3),
    "customer_email" TEXT,
    "customer_name" TEXT,
    "billing_address" JSONB,
    "notes" TEXT,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "id_order" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "payment_gateway" TEXT NOT NULL,
    "gateway_transaction_id" TEXT,
    "gateway_status" TEXT,
    "gateway_response" JSONB,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "gateway_fee" DOUBLE PRECISION,
    "net_amount" DOUBLE PRECISION,
    "payment_method" TEXT,
    "card_last_four" TEXT,
    "card_brand" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_audit_log" (
    "id" TEXT NOT NULL,
    "id_order" TEXT,
    "id_transaction" TEXT,
    "id_usuario" TEXT,
    "event_type" TEXT NOT NULL,
    "event_description" TEXT,
    "performed_by" TEXT,
    "performed_by_type" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reinicio_contrasenia" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fecha_exp" TIMESTAMP(3) NOT NULL,
    "id_usuario" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reinicio_contrasenia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_order_number_key" ON "payment_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transaction_id_key" ON "payment_transactions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "reinicio_contrasenia_token_key" ON "reinicio_contrasenia"("token");

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_id_cart_fkey" FOREIGN KEY ("id_cart") REFERENCES "shopping_cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_audit_log" ADD CONSTRAINT "payment_audit_log_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_audit_log" ADD CONSTRAINT "payment_audit_log_id_transaction_fkey" FOREIGN KEY ("id_transaction") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_audit_log" ADD CONSTRAINT "payment_audit_log_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reinicio_contrasenia" ADD CONSTRAINT "reinicio_contrasenia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
