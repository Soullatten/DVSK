-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'footer',
    "userId" TEXT,
    "country" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" TIMESTAMP(3),
    "tags" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Subscriber_email_idx" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Subscriber_source_idx" ON "Subscriber"("source");

-- CreateIndex
CREATE INDEX "Subscriber_unsubscribedAt_idx" ON "Subscriber"("unsubscribedAt");
