import { BookingStatus } from "@prisma/client";

import {
  changeBookingStatus,
  createBooking,
  createIdempotencyKey,
  finalizeIdempotencyKey,
  getIdempotencyKeyWithLock,
} from "../repositories/booking.repository";
import { generateIdempotencyKey } from "../utils/generateIdempotencyKeys";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "../utils/errors/app.error";
import { CreateBookingDto } from "../dto/booking.dto";
import { prisma } from "../lib/prisma";

export async function createBookingService({
  userId,
  hotelId,
  bookingAmount,
  totalGuests,
}: CreateBookingDto) {
  const booking = await createBooking({
    hotelId,
    userId,
    bookingAmount,
    totalGuests,
  });

  if (!booking) throw new InternalServerError("Failed to create booking");

  const idempotencyKey = generateIdempotencyKey();

  await createIdempotencyKey(idempotencyKey, booking.id);

  return {
    bookingId: booking.id,
    idempotencyKey,
  };
}

// For 2 parallel requests from same user, idempotency key will be different, hence we can take a lock.
export async function confirmBookingService(idempotencyKey: string) {
  return await prisma.$transaction(async (tx) => {
    const idempotencyKeyData = await getIdempotencyKeyWithLock(tx, idempotencyKey);
  
    if (!idempotencyKeyData) throw new NotFoundError("Idempotency key not found");
  
    if (idempotencyKeyData.finalized) {
      throw new ConflictError("Idempotency key already finalized");
    }
  
    const booking = await changeBookingStatus(tx, idempotencyKeyData.bookingId, BookingStatus.CONFIRMED);
    await finalizeIdempotencyKey(tx, idempotencyKeyData.id);
  
    return booking;
  });
}
