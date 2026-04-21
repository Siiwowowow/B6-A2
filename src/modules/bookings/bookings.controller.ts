import { Response } from 'express';
import * as BookingsService from './bookings.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { AuthRequest } from '../../types';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicle_id, rent_start_date, rent_end_date } = req.body;

    if (!vehicle_id || !rent_start_date || !rent_end_date) {
      sendError(res, 'vehicle_id, rent_start_date and rent_end_date are required.', 400);
      return;
    }

    const booking = await BookingsService.createBooking({
      customerId:    req.user!.userId,
      vehicleId:     Number(vehicle_id),
      rentStartDate: rent_start_date,
      rentEndDate:   rent_end_date,
    });

    sendSuccess(res, 'Booking created successfully.', booking, 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create booking.', err.status || 500);
  }
};

export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;
    const bookings = await BookingsService.getBookings(role, userId);
    sendSuccess(res, 'Bookings retrieved successfully.', bookings);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch bookings.', err.status || 500);
  }
};

export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, userId } = req.user!;
    const bookingId = Number(req.params.bookingId);

    // Determine action from role + body
    let action: 'cancel' | 'return';

    if (role === 'customer') {
      action = 'cancel';
    } else {
      // Admin — body should contain { status: "returned" }
      const { status } = req.body;
      if (status !== 'returned') {
        sendError(res, 'Admin can only set status to "returned".', 400);
        return;
      }
      action = 'return';
    }

    const updated = await BookingsService.updateBooking({
      requestorRole: role,
      requestorId:   userId,
      bookingId,
      action,
    });

    sendSuccess(res, 'Booking updated successfully.', updated);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update booking.', err.status || 500);
  }
};