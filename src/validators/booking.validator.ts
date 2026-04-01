import { z } from "zod";

export const createBookingSchema = z.object({
  userId: z
    .number({ message: "User ID is required" })
    .positive({ message: "User ID must be a positive number" }),
  hotelId: z
    .number({ message: "Hotel ID is required" })
    .positive({ message: "Hotel ID must be a positive number" }),
  bookingAmount: z
    .number({ message: "Booking amount is required" })
    .positive({ message: "Booking amount must be a positive number" })
    .min(1, { message: "Booking amount must be at least 1" }),
  totalGuests: z
    .number({ message: "Total guests is required" })
    .positive({ message: "Total guests must be a positive number" })
    .min(1, { message: "Total guests must be at least 1" }),
});
