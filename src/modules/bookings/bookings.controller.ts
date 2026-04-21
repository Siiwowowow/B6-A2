import { Response } from 'express';
import * as BookingsService from './bookings.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { AuthRequest } from '../../types';

// ─────────────────────────────────────────────────────────────
// 📦 CREATE BOOKING
// ─────────────────────────────────────────────────────────────
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicle_id, rent_start_date, rent_end_date } = req.body;

    if (!vehicle_id || !rent_start_date || !rent_end_date) {
      sendError(res, 'vehicle_id, rent_start_date and rent_end_date are required.', 400);
      return;
    }

    const booking = await BookingsService.createBooking({
      user_id: req.user!.userId,              // ✅ FIXED
      vehicle_id: Number(vehicle_id),         // ✅ FIXED
      rent_start_date: rent_start_date,       // ✅ FIXED
      rent_end_date: rent_end_date,           // ✅ FIXED
    });

    sendSuccess(res, 'Booking created successfully.', booking, 201);

  } catch (err: any) {
    sendError(res, err.message || 'Failed to create booking.', err.status || 500);
  }
};

// ─────────────────────────────────────────────────────────────
// 📄 GET BOOKINGS
// ─────────────────────────────────────────────────────────────
export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;

    const bookings = await BookingsService.getBookings(role, userId);

    sendSuccess(res, 'Bookings retrieved successfully.', bookings);

  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch bookings.', err.status || 500);
  }
};

// ─────────────────────────────────────────────────────────────
// 🔄 UPDATE BOOKING
// ─────────────────────────────────────────────────────────────
export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;
    const bookingId = Number(req.params.bookingId);

    let action: 'cancel' | 'return';

    if (role === 'customer') {
      action = 'cancel';
    } else {
      const { status } = req.body;

      if (status !== 'returned') {
        sendError(res, 'Admin can only set status to "returned".', 400);
        return;
      }

      action = 'return';
    }

    const updated = await BookingsService.updateBooking({
      requestorRole: role,
      requestorId: userId,
      bookingId,
      action,
    });

    sendSuccess(res, 'Booking updated successfully.', updated);

  } catch (err: any) {
    sendError(res, err.message || 'Failed to update booking.', err.status || 500);
  }
};