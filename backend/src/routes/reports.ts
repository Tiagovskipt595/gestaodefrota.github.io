import express from 'express';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/summary', requireAuth, async (_req, res) => {
  const db = getDb();
  const totalVehicles = (await db.get('SELECT COUNT(1) as count FROM vehicles')).count;
  const available = (await db.get("SELECT COUNT(1) as count FROM vehicles WHERE status = 'available'")).count;
  const reserved = (await db.get("SELECT COUNT(1) as count FROM vehicles WHERE status = 'reserved'")).count;
  const maintenance = (await db.get("SELECT COUNT(1) as count FROM vehicles WHERE status = 'maintenance'")).count;
  const upcoming = await db.all('SELECT r.id, r.startAt, r.endAt, v.plate, u.name FROM reservations r JOIN vehicles v ON v.id = r.vehicleId JOIN users u ON u.id = r.userId WHERE r.startAt >= ? ORDER BY r.startAt LIMIT 5', new Date().toISOString());
  const kmTotal = (await db.get('SELECT SUM(mileage) as totalMileage FROM vehicles')).totalMileage || 0;

  res.json({ totalVehicles, available, reserved, maintenance, upcoming, kmTotal });
});

router.get('/vehicle/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', Number(req.params.id));
  if (!vehicle) return res.status(404).json({ message: 'Viatura não encontrada' });
  const reservations = await db.all('SELECT * FROM reservations WHERE vehicleId = ? ORDER BY startAt DESC', Number(req.params.id));
  res.json({ vehicle, reservations });
});

router.get('/driver/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const driver = await db.get('SELECT id, name, department, email FROM users WHERE id = ?', Number(req.params.id));
  if (!driver) return res.status(404).json({ message: 'Condutor não encontrado' });
  const reservations = await db.all('SELECT r.*, v.plate, v.brand, v.model FROM reservations r JOIN vehicles v ON v.id = r.vehicleId WHERE userId = ? ORDER BY startAt DESC', Number(req.params.id));
  res.json({ driver, reservations });
});

export default router;
