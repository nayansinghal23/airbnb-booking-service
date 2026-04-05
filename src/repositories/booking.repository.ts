import { $Enums, IdempotencyKey, Prisma } from "@prisma/client";
import { validate } from 'uuid'

import { prisma } from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";

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
export async function createIdempotencyKey(idemKey: string, bookingId: number) {
  const idempotencyKey = await prisma.idempotencyKey.create({
    data: {
      idemKey,
      booking: {
        connect: {
          id: bookingId,
        },
      },
    },
  });

  return idempotencyKey;
}

export async function getIdempotencyKeyWithLock(tx: Prisma.TransactionClient, key: string) {
  if(!validate(key)) throw new BadRequestError("Invalid idempotency key format");

  const idempotencyKey: Array<IdempotencyKey> = await tx.$queryRaw(
    Prisma.raw(`
      SELECT * FROM IdempotencyKey WHERE idemKey = '${key}' FOR UPDATE;
    `)
  )
  if(!idempotencyKey || !idempotencyKey.length) throw new NotFoundError("Idempotency key not found");

  return idempotencyKey[0];
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
  tx: Prisma.TransactionClient,
  id: number,
  status: $Enums.BookingStatus,
) {
  const booking = await tx.booking.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });
  return booking;
}

export async function finalizeIdempotencyKey(tx: Prisma.TransactionClient, id: number) {
  const idempotencyKey = await tx.idempotencyKey.update({
    where: {
      id,
    },
    data: {
      finalized: true,
    },
  });
  return idempotencyKey;
}
