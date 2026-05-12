import express from 'express';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const db = getDb();
  const alerts = await db.all('SELECT a.*, v.plate, u.name as userName FROM alerts a LEFT JOIN vehicles v ON v.id = a.vehicleId LEFT JOIN users u ON u.id = a.userId ORDER BY createdAt DESC');
  res.json(alerts);
});

export default router;
