import { Request, Response } from 'express';

import { createBookingService, confirmBookingService } from '../services/booking.service';

export const createBookingHandler = async (req: Request, res: Response) => {
    const { userId, hotelId, bookingAmount, totalGuests } = req.body;
    const booking = await createBookingService({
        userId,
        hotelId,
        bookingAmount,
        totalGuests
    });
    res.status(201).json(booking);
    return;
}

export const confirmBookingHandler = async (req: Request, res: Response) => {
    const booking = await confirmBookingService(req.params.idempotencyKey);

    res.status(200).json(booking);
    return;
}