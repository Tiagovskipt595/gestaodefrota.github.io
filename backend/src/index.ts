import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.ts';
import vehicleRoutes from './routes/vehicles.ts';
import reservationRoutes from './routes/reservations.ts';
import driverRoutes from './routes/drivers.ts';
import reportRoutes from './routes/reports.ts';
import alertRoutes from './routes/alerts.ts';
import { errorHandler } from './middleware/error.ts';
import { initDb } from './db.ts';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://Tiagovskipt595.github.io'
  ]
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);

app.use(errorHandler);

await initDb();

app.listen(port, () => {
  console.log(`Fleet backend running on http://localhost:${port}`);
});
