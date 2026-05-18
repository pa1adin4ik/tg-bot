# Prisma Database Architecture

## Scope

This stage defines only the database architecture for the booking platform. The schema lives in [schema.prisma](/Users/marupovbexruz/Documents/New%20project/debug_bot_tgh/prisma/schema/schema.prisma).

## Why the model is structured this way

- `User` is the base identity for everyone in the system.
- `Admin` is a one-to-one profile over `User`, so admin accounts reuse the same identity model instead of introducing a second auth source.
- `Master` is also a one-to-one profile over `User`, which keeps staff identity, notifications, and future login flows unified.
- `Role` is attached to `Admin`, which keeps the role system focused on back-office access without overcomplicating customer accounts.
- `Service` and `Master` are many-to-many, because a master can provide multiple services and the same service can be offered by multiple masters.
- `Schedule` stores availability rules, while `TimeSlot` stores concrete bookable windows generated from those rules.
- `Booking` references `User`, `Master`, `Service`, and optionally `TimeSlot`, so the booking record remains the source of truth for the appointment itself.
- `Payment` is one-to-many from `Booking`, which supports deposits, final payments, retries, and refunds without breaking history.
- `Review` is one-to-one with `Booking`, which prevents multiple reviews for the same visit.
- `Notification` targets `User`, which keeps delivery consistent for clients, admins, and masters because they all inherit from the same identity root.

## Soft delete strategy

Soft delete is enabled with `deletedAt` on models that are commonly hidden, restored, or archived:

- `User`
- `Admin`
- `Role`
- `Service`
- `Master`
- `Review`
- `PortfolioWork`
- `Schedule`
- `TimeSlot`
- `Notification`

Soft delete is intentionally not used on:

- `Booking`, because appointment history should remain immutable and lifecycle is better represented by `status`
- `Payment`, because financial records should not disappear from history

## Double booking prevention

Prisma indexes help, but true overlap prevention for time ranges should be enforced with one extra PostgreSQL migration.

Recommended rule:

1. Store booking time directly on `Booking.startAt` and `Booking.endAt`.
2. Keep `TimeSlot` as availability/supporting structure, not the only source of truth.
3. Add a PostgreSQL exclusion constraint on active booking statuses for the same master.

Recommended SQL migration idea:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT booking_no_overlap_per_master
EXCLUDE USING gist (
  "masterId" WITH =,
  tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'AWAITING_PREPAYMENT', 'CONFIRMED', 'IN_PROGRESS'));
```

Why this is better than only using a unique slot id:

- it protects against overlaps even if slot generation changes later
- it still allows canceled and expired bookings to remain in history
- it works for both bot-created and admin-created bookings

## Schedule validation

The schema separates rules from generated availability:

- `Schedule` defines recurring or date-specific working windows and blocked periods
- `TimeSlot` defines concrete bookable intervals

Validation rules that should be enforced in the backend service layer:

1. `startMinute` must be less than `endMinute`
2. a schedule must have either `dayOfWeek` for recurring rules or `specificDate` for one-off overrides
3. generated `TimeSlot.startAt/endAt` must fall inside an active `WORKING_HOURS` schedule
4. generated slots must not intersect any active `BLOCKED_TIME` schedule
5. slots must respect service duration before they are exposed as bookable

Recommended extra DB checks in SQL migrations:

- `CHECK ("startMinute" >= 0 AND "startMinute" < 1440)`
- `CHECK ("endMinute" > 0 AND "endMinute" <= 1440)`
- `CHECK ("startMinute" < "endMinute")`

Prisma does not express these temporal checks well by itself, so the right architecture is Prisma schema plus service validation plus targeted SQL constraints.

## Payment reservation logic

The schema supports reservation-first payment flow through these fields:

- `Booking.status`
- `Booking.reservationExpiresAt`
- `Booking.prepaymentAmount`
- `Payment.kind`
- `Payment.status`
- `Payment.expiresAt`
- `TimeSlot.status`
- `TimeSlot.reservedUntil`

Recommended flow:

1. Create a booking in `PENDING` or `AWAITING_PREPAYMENT`
2. Set `Booking.reservationExpiresAt`
3. Mark the slot as `RESERVED` with `TimeSlot.reservedUntil`
4. Create a `Payment` row with `kind = PREPAYMENT` and `status = PENDING` or `RESERVED`
5. When the gateway confirms, move payment to `AUTHORIZED` or `CAPTURED`, then confirm the booking
6. If the reservation window expires, mark booking `EXPIRED`, payment `EXPIRED` or `CANCELED`, and free the slot

Why this design works:

- the slot can be held temporarily without pretending it is fully booked
- payment retries are preserved as separate payment records
- prepayment and final payment remain traceable independently
- expiration logic is easy to run with a background job later
