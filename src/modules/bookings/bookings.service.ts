import pool from '../../config/db';
import { IBooking } from '../../types';

// ─── Auto-mark returned bookings whose end date has passed ──────────────────
export const autoMarkReturned = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Find overdue active bookings safely
    const overdue = await client.query(
      `
      SELECT id, vehicle_id
      FROM bookings
      WHERE status = 'active'
        AND rent_end_date IS NOT NULL
        AND rent_end_date < NOW()
      `
    );

    if (overdue.rowCount && overdue.rowCount > 0) {
      const bookingIds = overdue.rows.map(r => r.id);
      const vehicleIds = overdue.rows.map(r => r.vehicle_id);

      // 2. Update bookings
      await client.query(
        `
        UPDATE bookings
        SET status = 'returned'
        WHERE id = ANY($1::int[])
        `,
        [bookingIds]
      );

      // 3. Update vehicles
      await client.query(
        `
        UPDATE vehicles
        SET availability_status = 'available'
        WHERE id = ANY($1::int[])
        `,
        [vehicleIds]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── Create Booking ──────────────────────────────────────────────────────────
interface CreateBookingInput {
  customerId:      number;
  vehicleId:       number;
  rentStartDate:   string;   // ISO date string e.g. "2025-06-01"
  rentEndDate:     string;
}

export const createBooking = async (input: CreateBookingInput) => {
  const { customerId, vehicleId, rentStartDate, rentEndDate } = input;

  const start = new Date(rentStartDate);
  const end   = new Date(rentEndDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw { status: 400, message: 'Invalid date format.' };
  }

  if (end <= start) {
    throw { status: 400, message: 'rent_end_date must be after rent_start_date.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock vehicle row
    const vehicleResult = await client.query(
      `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`,
      [vehicleId],
    );
    const vehicle = vehicleResult.rows[0];
    if (!vehicle) throw { status: 404, message: 'Vehicle not found.' };

    if (vehicle.availability_status !== 'available') {
      throw { status: 409, message: 'Vehicle is not available for booking.' };
    }

    // Calculate days (ceil to ensure full days are charged)
    const msInDay = 1000 * 60 * 60 * 24;
    const days    = Math.ceil((end.getTime() - start.getTime()) / msInDay);
    const total   = parseFloat((days * Number(vehicle.daily_rent_price)).toFixed(2));

    // Create booking
    const bookingResult = await client.query<IBooking>(
      `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [customerId, vehicleId, rentStartDate, rentEndDate, total],
    );

    // Mark vehicle as booked
    await client.query(
      `UPDATE vehicles SET availability_status = 'booked' WHERE id = $1`,
      [vehicleId],
    );

    await client.query('COMMIT');
    return bookingResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── Get Bookings ────────────────────────────────────────────────────────────
export const getBookings = async (role: string, userId: number) => {
  // Auto-mark overdue bookings first
  await autoMarkReturned();

  let query: string;
  let params: unknown[];

  if (role === 'admin') {
    query = `
      SELECT b.*,
             u.name  AS customer_name, u.email AS customer_email,
             v.vehicle_name, v.registration_number, v.type
      FROM bookings b
      JOIN users    u ON u.id = b.customer_id
      JOIN vehicles v ON v.id = b.vehicle_id
      ORDER BY b.created_at DESC`;
    params = [];
  } else {
    query = `
      SELECT b.*,
             v.vehicle_name, v.registration_number, v.type
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.customer_id = $1
      ORDER BY b.created_at DESC`;
    params = [userId];
  }

  const result = await pool.query(query, params);
  return result.rows;
};

// ─── Update Booking ──────────────────────────────────────────────────────────
interface UpdateBookingInput {
  requestorRole: string;
  requestorId:   number;
  bookingId:     number;
  action:        'cancel' | 'return';   // derived from role in controller
}

export const updateBooking = async (input: UpdateBookingInput) => {
  const { requestorRole, requestorId, bookingId, action } = input;

  const bookingResult = await pool.query<IBooking>(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId],
  );
  const booking = bookingResult.rows[0];
  if (!booking) throw { status: 404, message: 'Booking not found.' };

  // Customer can only manage their own bookings
  if (requestorRole === 'customer' && booking.customer_id !== requestorId) {
    throw { status: 403, message: 'You can only manage your own bookings.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (action === 'cancel') {
      // Customer cancels — only allowed before start date
      if (booking.status !== 'active') {
        throw { status: 400, message: `Cannot cancel a booking with status '${booking.status}'.` };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(booking.rent_start_date);

      if (startDate <= today) {
        throw { status: 400, message: 'Cannot cancel a booking after or on the start date.' };
      }

      await client.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
        [bookingId],
      );
      await client.query(
        `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
        [booking.vehicle_id],
      );

    } else if (action === 'return') {
      // Admin marks as returned
      if (booking.status !== 'active') {
        throw { status: 400, message: `Cannot return a booking with status '${booking.status}'.` };
      }

      await client.query(
        `UPDATE bookings SET status = 'returned' WHERE id = $1`,
        [bookingId],
      );
      await client.query(
        `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
        [booking.vehicle_id],
      );
    }

    await client.query('COMMIT');

    const updated = await pool.query<IBooking>(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId],
    );
    return updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};