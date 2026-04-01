import { BookingStatus } from "@prisma/client";

import {
  changeBookingStatus,
  createBooking,
  createIdempotencyKey,
  finalizeIdempotencyKey,
  getIdempotencyKey,
} from "../repositories/booking.repository";
import { generateIdempotencyKey } from "../utils/generateIdempotencyKeys";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "../utils/errors/app.error";
import { CreateBookingDto } from "../dto/booking.dto";

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

export async function confirmBookingService(idempotencyKey: string) {
  const idempotencyKeyData = await getIdempotencyKey(idempotencyKey);

  if (!idempotencyKeyData) throw new NotFoundError("Invalid idempotency key");

  if (idempotencyKeyData.finalized)
    throw new ConflictError("Idempotency key already finalized");

  const booking = await changeBookingStatus(idempotencyKeyData.bookingId, BookingStatus.CONFIRMED);
  await finalizeIdempotencyKey(idempotencyKeyData.id);

  return booking;
}
