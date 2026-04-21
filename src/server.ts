import app from './app';
import pool from './config/db';
import { autoMarkReturned } from './modules/bookings/bookings.service';

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');

    await autoMarkReturned();
    console.log('✅ Auto-mark completed');

    app.listen(PORT, () => {
      console.log(`🚀 Server running: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed:', err);
    process.exit(1);
  }
};

startServer();