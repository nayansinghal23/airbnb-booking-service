import { prisma } from "../lib/prisma";
import { BookingCreateInput } from "../src/generated/prisma/models";

export async function createBooking(data: BookingCreateInput) {
  try {
    const booking = await prisma.booking.create({
      data,
    });
    return booking;
  } catch (error) {
    console.error(`Error while creating booking: ${error}`);
  }
}
