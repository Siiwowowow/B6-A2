import pool from '../../config/db';
import { IVehicle } from '../../types';

interface CreateVehicleInput {
  vehicle_name:        string;
  type:                'car' | 'bike' | 'van' | 'SUV';
  registration_number: string;
  daily_rent_price:    number;
  availability_status?: 'available' | 'booked';
}

export const createVehicle = async (input: CreateVehicleInput) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status = 'available',
  } = input;

  // Check duplicate registration
  const existing = await pool.query(
    'SELECT id FROM vehicles WHERE registration_number = $1',
    [registration_number],
  );
  if (existing.rowCount && existing.rowCount > 0) {
    throw { status: 409, message: 'Registration number already exists.' };
  }

  const result = await pool.query<IVehicle>(
    `INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status],
  );

  return result.rows[0];
};

export const getAllVehicles = async () => {
  const result = await pool.query<IVehicle>(
    'SELECT * FROM vehicles ORDER BY created_at DESC',
  );
  return result.rows;
};

export const getVehicleById = async (vehicleId: number) => {
  const result = await pool.query<IVehicle>(
    'SELECT * FROM vehicles WHERE id = $1',
    [vehicleId],
  );
  if (!result.rows[0]) {
    throw { status: 404, message: 'Vehicle not found.' };
  }
  return result.rows[0];
};

interface UpdateVehicleInput {
  vehicle_name?:        string;
  type?:                'car' | 'bike' | 'van' | 'SUV';
  registration_number?: string;
  daily_rent_price?:    number;
  availability_status?: 'available' | 'booked';
}

export const updateVehicle = async (vehicleId: number, input: UpdateVehicleInput) => {
  await getVehicleById(vehicleId);

  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = input;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (vehicle_name)        { fields.push(`vehicle_name = $${idx++}`);        values.push(vehicle_name); }
  if (type)                { fields.push(`type = $${idx++}`);                values.push(type); }
  if (registration_number) { fields.push(`registration_number = $${idx++}`); values.push(registration_number); }
  if (daily_rent_price)    { fields.push(`daily_rent_price = $${idx++}`);    values.push(daily_rent_price); }
  if (availability_status) { fields.push(`availability_status = $${idx++}`); values.push(availability_status); }

  if (fields.length === 0) {
    throw { status: 400, message: 'No fields provided to update.' };
  }

  values.push(vehicleId);
  const result = await pool.query<IVehicle>(
    `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );

  return result.rows[0];
};

export const deleteVehicle = async (vehicleId: number) => {
  await getVehicleById(vehicleId);

  // Check for active bookings on this vehicle
  const active = await pool.query(
    `SELECT id FROM bookings WHERE vehicle_id = $1 AND status = 'active'`,
    [vehicleId],
  );
  if (active.rowCount && active.rowCount > 0) {
    throw { status: 409, message: 'Cannot delete vehicle with active bookings.' };
  }

  await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);
};