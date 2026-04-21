import bcrypt from 'bcrypt';
import pool from '../../config/db';
import { signToken } from '../../utils/jwt.util';
import { IUser } from '../../types';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

interface SignupInput {
  name:     string;
  email:    string;
  password: string;
  phone:    string;
  role?:    'admin' | 'customer';
}

interface SigninInput {
  email:    string;
  password: string;
}

export const signup = async (input: SignupInput) => {
  const { name, email, password, phone, role = 'customer' } = input;

  // Check duplicate email
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()],
  );
  if (existing.rowCount && existing.rowCount > 0) {
    throw { status: 409, message: 'Email already registered.' };
  }

  if (password.length < 6) {
    throw { status: 400, message: 'Password must be at least 6 characters.' };
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const result = await pool.query<IUser>(
    `INSERT INTO users (name, email, password, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role, created_at`,
    [name, email.toLowerCase(), hashedPassword, phone, role],
  );

  return result.rows[0];
};

export const signin = async (input: SigninInput) => {
  const { email, password } = input;

  const result = await pool.query<IUser>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()],
  );

  const user = result.rows[0];
  if (!user) {
    throw { status: 401, message: 'Invalid email or password.' };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid email or password.' };
  }

  const token = signToken({
    userId: user.id,
    email:  user.email,
    role:   user.role,
  });

  const { password: _pwd, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};