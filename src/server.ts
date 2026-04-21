import app from './app';
import pool from './config/db';
import { autoMarkReturned } from './modules/bookings/bookings.service';

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ DB Connected');

    // SAFE AUTO RUN (no crash)
    try {
      await autoMarkReturned();
      console.log('✅ Auto-mark completed');
    } catch (err) {
      console.log('⚠️ Auto-mark skipped safely');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server failed:', error);
    process.exit(1);
  }
};

startServer();