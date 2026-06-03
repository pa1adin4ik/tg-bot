-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'INVITED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'AWAITING_PREPAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING_MODERATION', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'RESERVED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('PREPAYMENT', 'FULL', 'REMAINING', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'ONLINE', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PortfolioMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('WORKING_HOURS', 'BLOCKED_TIME');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "TimeSlotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM', 'EMAIL', 'SMS', 'PUSH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELED', 'BOOKING_REMINDER', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'REVIEW_REMINDER', 'SCHEDULE_CHANGED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ', 'CANCELED');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'EUR', 'UZS');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "telegramId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "locale" VARCHAR(10),
    "timezone" VARCHAR(64),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'UZS',
    "prepaymentRequired" BOOLEAN NOT NULL DEFAULT false,
    "prepaymentAmount" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Master" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "experienceYears" INTEGER,
    "ratingAvg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "masterId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "timeSlotId" UUID,
    "createdByAdminId" UUID,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "prepaymentAmount" DECIMAL(12,2),
    "currency" "CurrencyCode" NOT NULL DEFAULT 'UZS',
    "notes" TEXT,
    "cancelReason" TEXT,
    "reservationExpiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "masterId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING_MODERATION',
    "moderatedAt" TIMESTAMP(3),
    "moderatedByAdminId" UUID,
    "rejectReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'UZS',
    "externalReference" TEXT,
    "reservedAt" TIMESTAMP(3),
    "authorizedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioWork" (
    "id" UUID NOT NULL,
    "masterId" UUID NOT NULL,
    "categoryId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "caption" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "PortfolioMediaType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" UUID NOT NULL,
    "masterId" UUID NOT NULL,
    "type" "ScheduleType" NOT NULL DEFAULT 'WORKING_HOURS',
    "dayOfWeek" "DayOfWeek",
    "specificDate" DATE,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATE,
    "validTo" DATE,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" UUID NOT NULL,
    "masterId" UUID NOT NULL,
    "scheduleId" UUID,
    "status" "TimeSlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reservedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookingId" UUID,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "idempotencyKey" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MasterToService" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MasterToService_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_status_deletedAt_idx" ON "User"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE INDEX "Admin_roleId_isActive_deletedAt_idx" ON "Admin"("roleId", "isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE INDEX "Role_isSystem_deletedAt_idx" ON "Role"("isSystem", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_categoryId_isActive_deletedAt_idx" ON "Service"("categoryId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Service_isActive_deletedAt_idx" ON "Service"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_isActive_deletedAt_sortOrder_idx" ON "ServiceCategory"("isActive", "deletedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "ServiceCategory_name_idx" ON "ServiceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Master_userId_key" ON "Master"("userId");

-- CreateIndex
CREATE INDEX "Master_isVisible_deletedAt_idx" ON "Master"("isVisible", "deletedAt");

-- CreateIndex
CREATE INDEX "Booking_userId_createdAt_idx" ON "Booking"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_masterId_startAt_endAt_idx" ON "Booking"("masterId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Booking_serviceId_startAt_idx" ON "Booking"("serviceId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_status_reservationExpiresAt_idx" ON "Booking"("status", "reservationExpiresAt");

-- CreateIndex
CREATE INDEX "Booking_timeSlotId_idx" ON "Booking"("timeSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_masterId_status_createdAt_idx" ON "Review"("masterId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalReference_key" ON "Payment"("externalReference");

-- CreateIndex
CREATE INDEX "Payment_bookingId_status_kind_idx" ON "Payment"("bookingId", "status", "kind");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_expiresAt_idx" ON "Payment"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCategory_slug_key" ON "PortfolioCategory"("slug");

-- CreateIndex
CREATE INDEX "PortfolioCategory_sortOrder_idx" ON "PortfolioCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioWork_masterId_isPublished_deletedAt_idx" ON "PortfolioWork"("masterId", "isPublished", "deletedAt");

-- CreateIndex
CREATE INDEX "PortfolioWork_masterId_isFeatured_deletedAt_idx" ON "PortfolioWork"("masterId", "isFeatured", "deletedAt");

-- CreateIndex
CREATE INDEX "PortfolioWork_categoryId_idx" ON "PortfolioWork"("categoryId");

-- CreateIndex
CREATE INDEX "PortfolioWork_sortOrder_idx" ON "PortfolioWork"("sortOrder");

-- CreateIndex
CREATE INDEX "Schedule_masterId_type_isActive_deletedAt_idx" ON "Schedule"("masterId", "type", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Schedule_masterId_dayOfWeek_validFrom_validTo_idx" ON "Schedule"("masterId", "dayOfWeek", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "Schedule_masterId_specificDate_idx" ON "Schedule"("masterId", "specificDate");

-- CreateIndex
CREATE INDEX "TimeSlot_masterId_status_startAt_idx" ON "TimeSlot"("masterId", "status", "startAt");

-- CreateIndex
CREATE INDEX "TimeSlot_scheduleId_idx" ON "TimeSlot"("scheduleId");

-- CreateIndex
CREATE INDEX "TimeSlot_reservedUntil_idx" ON "TimeSlot"("reservedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_masterId_startAt_endAt_key" ON "TimeSlot"("masterId", "startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_bookingId_channel_idx" ON "Notification"("bookingId", "channel");

-- CreateIndex
CREATE INDEX "Notification_type_status_idx" ON "Notification"("type", "status");

-- CreateIndex
CREATE INDEX "Notification_status_nextAttemptAt_idx" ON "Notification"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "_MasterToService_B_index" ON "_MasterToService"("B");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Master" ADD CONSTRAINT "Master_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioWork" ADD CONSTRAINT "PortfolioWork_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioWork" ADD CONSTRAINT "PortfolioWork_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PortfolioCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MasterToService" ADD CONSTRAINT "_MasterToService_A_fkey" FOREIGN KEY ("A") REFERENCES "Master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MasterToService" ADD CONSTRAINT "_MasterToService_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SeedDemoData
INSERT INTO "Role" ("id", "code", "name", "description", "permissions", "isSystem", "createdAt", "updatedAt")
VALUES
  ('10000000-0000-4000-8000-000000000001', 'SUPER_ADMIN', 'Super Admin', 'Full system access', ARRAY['*']::TEXT[], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000002', 'ADMIN', 'Admin', 'Salon administration access', ARRAY['bookings:manage','services:manage','masters:manage']::TEXT[], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000003', 'MANAGER', 'Manager', 'Operational booking access', ARRAY['bookings:manage','schedule:manage']::TEXT[], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  ('20000000-0000-4000-8000-000000000001', 'Hair Services', 'hair-services', 'Cuts, styling, and care procedures.', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', 'Nails', 'nails', 'Manicure, pedicure, and nail design.', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', 'Beauty Care', 'beauty-care', 'Brows, lashes, and cosmetic care.', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Service" ("id", "categoryId", "name", "slug", "description", "durationMinutes", "price", "currency", "prepaymentRequired", "prepaymentAmount", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Women Haircut', 'women-haircut', 'Consultation, haircut, and basic styling.', 60, 180000.00, 'UZS', false, NULL, 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Hair Coloring', 'hair-coloring', 'Coloring consultation and application.', 120, 450000.00, 'UZS', true, 100000.00, 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'Classic Manicure', 'classic-manicure', 'Nail shaping, cuticle care, and polish.', 45, 120000.00, 'UZS', false, NULL, 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'Gel Manicure', 'gel-manicure', 'Long-lasting gel polish manicure.', 75, 200000.00, 'UZS', false, NULL, 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'Brow Styling', 'brow-styling', 'Brow shaping and tinting.', 40, 110000.00, 'UZS', false, NULL, 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "User" ("id", "email", "phone", "firstName", "lastName", "avatarUrl", "timezone", "status", "createdAt", "updatedAt")
VALUES
  ('40000000-0000-4000-8000-000000000001', 'aziza.master@example.com', '+998901112233', 'Aziza', 'Karimova', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'Asia/Tashkent', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('40000000-0000-4000-8000-000000000002', 'madina.master@example.com', '+998902223344', 'Madina', 'Rakhimova', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'Asia/Tashkent', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Master" ("id", "userId", "bio", "experienceYears", "ratingAvg", "reviewCount", "isVisible", "createdAt", "updatedAt")
VALUES
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Hair stylist focused on clean shape, soft color, and everyday wearable results.', 6, 4.90, 32, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'Nail and brow specialist with a detail-first approach.', 4, 4.80, 21, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "_MasterToService" ("A", "B")
VALUES
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000005');

INSERT INTO "Schedule" ("id", "masterId", "type", "dayOfWeek", "startMinute", "endMinute", "timezone", "isRecurring", "isActive", "createdAt", "updatedAt")
VALUES
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'WORKING_HOURS', 'MONDAY', 600, 1080, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', 'WORKING_HOURS', 'TUESDAY', 600, 1080, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000001', 'WORKING_HOURS', 'WEDNESDAY', 600, 1080, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000001', 'WORKING_HOURS', 'THURSDAY', 600, 1080, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000001', 'WORKING_HOURS', 'FRIDAY', 600, 1080, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000006', '50000000-0000-4000-8000-000000000002', 'WORKING_HOURS', 'MONDAY', 660, 1140, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000007', '50000000-0000-4000-8000-000000000002', 'WORKING_HOURS', 'TUESDAY', 660, 1140, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000008', '50000000-0000-4000-8000-000000000002', 'WORKING_HOURS', 'WEDNESDAY', 660, 1140, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000009', '50000000-0000-4000-8000-000000000002', 'WORKING_HOURS', 'THURSDAY', 660, 1140, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000010', '50000000-0000-4000-8000-000000000002', 'WORKING_HOURS', 'SATURDAY', 660, 960, 'Asia/Tashkent', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "PortfolioCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('70000000-0000-4000-8000-000000000001', 'Salon Works', 'salon-works', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "PortfolioWork" ("id", "masterId", "categoryId", "title", "description", "mediaUrl", "mediaType", "sortOrder", "isFeatured", "isPublished", "createdAt", "updatedAt")
VALUES
  ('80000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Soft layered haircut', 'Clean layered shape with natural finish.', 'https://images.unsplash.com/photo-1562322140-8baeececf3df', 'IMAGE', 10, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('80000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 'Minimal gel manicure', 'Simple long-lasting nude gel manicure.', 'https://images.unsplash.com/photo-1604654894610-df63bc536371', 'IMAGE', 20, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
