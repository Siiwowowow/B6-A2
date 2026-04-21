import pool from '../../config/db';
import { IVehicle } from '../../types';

// ─────────────────────────────
// CREATE VEHICLE
// ─────────────────────────────
export const createVehicle = async (input: any) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status = 'available',
  } = input;

  const existing = await pool.query(
    `SELECT id FROM vehicles WHERE registration_number = $1`,
    [registration_number]
  );

  if (existing.rowCount) {
    throw { status: 409, message: 'Registration number already exists.' };
  }

  const result = await pool.query<IVehicle>(
    `INSERT INTO vehicles
     (vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status]
  );

  return result.rows[0];
};

// ─────────────────────────────
// GET ALL
// ─────────────────────────────
export const getAllVehicles = async () => {
  const result = await pool.query(
    `SELECT * FROM vehicles ORDER BY created_at DESC`
  );
  return result.rows;
};

// ─────────────────────────────
// GET BY ID
// ─────────────────────────────
export const getVehicleById = async (vehicleId: number) => {
  const result = await pool.query(
    `SELECT * FROM vehicles WHERE id = $1`,
    [vehicleId]
  );

  if (!result.rows[0]) {
    throw { status: 404, message: 'Vehicle not found.' };
  }

  return result.rows[0];
};

// ─────────────────────────────
// UPDATE VEHICLE (FIXED 0 VALUE BUG)
// ─────────────────────────────
export const updateVehicle = async (vehicleId: number, input: any) => {
  await getVehicleById(vehicleId);

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (input.vehicle_name !== undefined) {
    fields.push(`vehicle_name = $${idx++}`);
    values.push(input.vehicle_name);
  }

  if (input.type !== undefined) {
    fields.push(`type = $${idx++}`);
    values.push(input.type);
  }

  if (input.registration_number !== undefined) {
    fields.push(`registration_number = $${idx++}`);
    values.push(input.registration_number);
  }

  if (input.daily_rent_price !== undefined) {
    fields.push(`daily_rent_price = $${idx++}`);
    values.push(input.daily_rent_price);
  }

  if (input.availability_status !== undefined) {
    fields.push(`availability_status = $${idx++}`);
    values.push(input.availability_status);
  }

  if (!fields.length) {
    throw { status: 400, message: 'No fields provided to update.' };
  }

  values.push(vehicleId);

  const result = await pool.query(
    `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0];
};

// ─────────────────────────────
// DELETE VEHICLE
// ─────────────────────────────
export const deleteVehicle = async (vehicleId: number) => {
  await getVehicleById(vehicleId);

  const active = await pool.query(
    `SELECT id FROM bookings WHERE vehicle_id = $1 AND status = 'active'`,
    [vehicleId]
  );

  if (active.rowCount) {
    throw { status: 409, message: 'Cannot delete vehicle with active bookings.' };
  }

  await pool.query(`DELETE FROM vehicles WHERE id = $1`, [vehicleId]);
};