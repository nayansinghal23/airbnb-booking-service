import express from 'express';

import { createBookingSchema } from '../../validators/booking.validator';
import { validateRequestBody } from '../../validators';
import { confirmBookingHandler, createBookingHandler } from '../../controllers/booking.controllers';

const bookingRouter = express.Router();

bookingRouter.post('/', validateRequestBody(createBookingSchema), createBookingHandler)
bookingRouter.post('/confirm/:idempotencyKey', confirmBookingHandler)

export default bookingRouter;