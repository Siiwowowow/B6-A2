import app  from './app';
import pool from './config/db';
import { autoMarkReturned } from './modules/bookings/bookings.service';

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Verify DB connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');

    // Run auto-mark on startup
    await autoMarkReturned();
    console.log('✅ Auto-marked overdue bookings');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API base: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();