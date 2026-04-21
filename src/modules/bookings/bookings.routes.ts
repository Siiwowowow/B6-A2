import { Router } from 'express';
import * as BookingsController from './bookings.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('admin', 'customer'), BookingsController.createBooking);
router.get('/', authorize('admin', 'customer'), BookingsController.getBookings);
router.put('/:bookingId', authorize('admin', 'customer'), BookingsController.updateBooking);

export default router;