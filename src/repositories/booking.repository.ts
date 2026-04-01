import { $Enums, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

export async function createBooking(data: Prisma.BookingCreateInput) {
  const booking = await prisma.booking.create({
    data,
  });

  return booking;
}

/**
 * Flow for idempotency key:
 * 1. Create booking, then create idempotency key => Synchronouse, causes latency issues but doesn't require retry logics.
 * 2. Parallely create booking and idempotency key, then update the idempotency key with the booking instance asynchronously => Requires retry logics.
 */
export async function createIdempotencyKey(key: string, bookingId: number) {
  const idempotencyKey = await prisma.idempotencyKey.create({
    data: {
      key,
      booking: {
        connect: {
          id: bookingId,
        },
      },
    },
  });

  return idempotencyKey;
}

export async function getIdempotencyKey(key: string) {
  const idempotencyKey = await prisma.idempotencyKey.findUnique({
    where: {
      key,
    },
  });
  return idempotencyKey;
}

export async function getBookingById(id: number) {
  const booking = await prisma.booking.findUnique({
    where: {
      id,
    },
  });
  return booking;
}

/**
 * Stages of a ticket ->
 * 1. Pending -> Confirmed -> Cancelled
 * 2. Pending -> Cancelled
 *
 * Ways to handle the status changes ->
 * 1. Create individual functions for each status change. -> Code repetition
 * 2. Use a single function with a switch / if-else statements. -> Code complexity, horrible maintainability.
 */
export async function changeBookingStatus(
  id: number,
  status: $Enums.BookingStatus,
) {
  const booking = await prisma.booking.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });
  return booking;
}

export async function finalizeIdempotencyKey(id: number) {
  const idempotencyKey = await prisma.idempotencyKey.update({
    where: {
      id,
    },
    data: {
      finalized: true,
    },
  });
  return idempotencyKey;
}
