import express from 'express';
import dotenv from 'dotenv';
import authRoutes     from './modules/auth/auth.routes';
import usersRoutes    from './modules/users/users.routes';
import vehiclesRoutes from './modules/vehicles/vehicles.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/users',    usersRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/bookings', bookingsRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;