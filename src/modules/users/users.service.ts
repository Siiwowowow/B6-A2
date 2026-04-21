import bcrypt from 'bcrypt';
import pool from '../../config/db';
import { IUser } from '../../types';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

export const getAllUsers = async () => {
  const result = await pool.query<Omit<IUser, 'password'>>(
    'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC',
  );
  return result.rows;
};

export const getUserById = async (userId: number) => {
  const result = await pool.query<IUser>(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
    [userId],
  );
  if (!result.rows[0]) {
    throw { status: 404, message: 'User not found.' };
  }
  return result.rows[0];
};

interface UpdateUserInput {
  name?:     string;
  email?:    string;
  password?: string;
  phone?:    string;
  role?:     'admin' | 'customer';
}

export const updateUser = async (userId: number, input: UpdateUserInput) => {
  const { name, email, password, phone, role } = input;

  // Ensure user exists
  await getUserById(userId);

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (name)     { fields.push(`name = $${idx++}`);     values.push(name); }
  if (email)    { fields.push(`email = $${idx++}`);    values.push(email.toLowerCase()); }
  if (phone)    { fields.push(`phone = $${idx++}`);    values.push(phone); }
  if (role)     { fields.push(`role = $${idx++}`);     values.push(role); }
  if (password) {
    if (password.length < 6) throw { status: 400, message: 'Password must be at least 6 characters.' };
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    fields.push(`password = $${idx++}`);
    values.push(hashed);
  }

  if (fields.length === 0) {
    throw { status: 400, message: 'No fields provided to update.' };
  }

  values.push(userId);
  const result = await pool.query<IUser>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, email, phone, role, created_at`,
    values,
  );

  return result.rows[0];
};

export const deleteUser = async (userId: number) => {
  // Ensure user exists
  await getUserById(userId);

  // Check for active bookings
  const active = await pool.query(
    `SELECT id FROM bookings WHERE customer_id = $1 AND status = 'active'`,
    [userId],
  );
  if (active.rowCount && active.rowCount > 0) {
    throw { status: 409, message: 'Cannot delete user with active bookings.' };
  }

  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
};