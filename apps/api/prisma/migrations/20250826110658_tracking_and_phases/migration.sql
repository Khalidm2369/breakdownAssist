-- CreateEnum
CREATE TYPE "JobPhase" AS ENUM ('ASSIGNED', 'EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF', 'COMPLETE', 'CANCELED');

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dropoffLat" DOUBLE PRECISION,
ADD COLUMN     "dropoffLng" DOUBLE PRECISION,
ADD COLUMN     "lastLat" DOUBLE PRECISION,
ADD COLUMN     "lastLng" DOUBLE PRECISION,
ADD COLUMN     "lastPingAt" TIMESTAMP(3),
ADD COLUMN     "phase" "JobPhase" NOT NULL DEFAULT 'ASSIGNED',
ADD COLUMN     "pickupLat" DOUBLE PRECISION,
ADD COLUMN     "pickupLng" DOUBLE PRECISION,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TrackingPing" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speedKph" DOUBLE PRECISION,
    "headingDeg" DOUBLE PRECISION,
    "accuracyM" DOUBLE PRECISION,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingPing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackingPing_requestId_ts_idx" ON "TrackingPing"("requestId", "ts");

-- CreateIndex
CREATE INDEX "TrackingPing_providerId_ts_idx" ON "TrackingPing"("providerId", "ts");

-- AddForeignKey
ALTER TABLE "TrackingPing" ADD CONSTRAINT "TrackingPing_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingPing" ADD CONSTRAINT "TrackingPing_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
