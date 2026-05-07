-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'MOCKED');

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "intendedEmail" TEXT,
    "orderId" TEXT,
    "userId" TEXT,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "errorMessage" TEXT,
    "wasMocked" BOOLEAN NOT NULL DEFAULT false,
    "wasTestRedirect" BOOLEAN NOT NULL DEFAULT false,
    "variables" JSONB,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_orderId_idx" ON "EmailLog"("orderId");

-- CreateIndex
CREATE INDEX "EmailLog_userId_idx" ON "EmailLog"("userId");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_templateKey_idx" ON "EmailLog"("templateKey");
