-- CreateTable
CREATE TABLE "TunnelIngress" (
    "id" TEXT NOT NULL,
    "hostname" TEXT,
    "service" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TunnelIngress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TunnelIngress_sortOrder_idx" ON "TunnelIngress"("sortOrder");
