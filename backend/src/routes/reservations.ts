import express from 'express';
import { getDb } from '../db.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

async function isReservationConflict(vehicleId: number, startAt: string, endAt: string, excludeId?: number) {
  const db = getDb();
  const sql = `SELECT COUNT(1) as count FROM reservations WHERE vehicleId = ? AND id != COALESCE(?, id) AND NOT (endAt <= ? OR startAt >= ?)`;
  const result = await db.get(sql, vehicleId, excludeId || 0, startAt, endAt);
  return result.count > 0;
}

function isValidDateRange(startAt: string, endAt: string, isNew: boolean = true) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const now = new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  if (isNew && start <= now) return false;
  return end > start;
}

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = await db.all('SELECT r.*, v.plate, v.brand, v.model, u.name as driverName FROM reservations r JOIN vehicles v ON v.id = r.vehicleId JOIN users u ON u.id = r.userId');
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', Number(req.params.id));
  if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });
  res.json(reservation);
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { vehicleId, startAt, endAt, purpose, destination, notes, startMileage } = req.body;
  const userId = req.user?.id;

  if (!vehicleId || !userId || !startAt || !endAt) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta' });
  }

  if (!isValidDateRange(startAt, endAt, false)) {
    return res.status(400).json({ message: 'As datas devem ser válidas e a data de término posterior à de início' });
  }

  if (await isReservationConflict(vehicleId, startAt, endAt)) {
    return res.status(400).json({ message: 'A viatura já tem reserva nesse período' });
  }

  const db = getDb();
  const result = await db.run('INSERT INTO reservations (vehicleId, userId, startAt, endAt, purpose, destination, status, notes, startMileage, endMileage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', vehicleId, userId, startAt, endAt, purpose, destination, 'confirmed', notes, startMileage ?? null, null);
  await db.run('UPDATE vehicles SET status = ? WHERE id = ?', 'reserved', vehicleId);

  res.status(201).json({ id: result.lastID });
});

router.put('/:id', requireAuth, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  const { vehicleId, startAt, endAt, purpose, destination, status, notes, pickupAt, dropoffAt, startMileage, endMileage, fuelStart, fuelEnd } = req.body;
  const userId = req.user?.id;

  if (!vehicleId || !userId || !startAt || !endAt) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta' });
  }

  if (!isValidDateRange(startAt, endAt, false)) {
    return res.status(400).json({ message: 'As datas devem ser válidas e a data de término posterior à de início' });
  }

  if (await isReservationConflict(vehicleId, startAt, endAt, Number(req.params.id))) {
    return res.status(400).json({ message: 'A viatura já tem reserva nesse período' });
  }

  const db = getDb();
  const result = await db.run(
    'UPDATE reservations SET vehicleId = ?, userId = ?, startAt = ?, endAt = ?, purpose = ?, destination = ?, status = ?, notes = ?, pickupAt = ?, dropoffAt = ?, startMileage = ?, endMileage = ?, fuelStart = ?, fuelEnd = ? WHERE id = ?',
    vehicleId,
    userId,
    startAt,
    endAt,
    purpose,
    destination,
    status || 'confirmed',
    notes,
    pickupAt,
    dropoffAt,
    startMileage,
    endMileage,
    fuelStart,
    fuelEnd,
    Number(req.params.id)
  );
  if (result.changes === 0) return res.status(404).json({ message: 'Reserva não encontrada' });

  // If reservation is being completed, update vehicle mileage (if provided) and then delete reservation
  if (status === 'completed') {
    if (endMileage !== null && endMileage !== undefined) {
      await db.run('UPDATE vehicles SET mileage = ? WHERE id = ?', endMileage, vehicleId);
    }
    await db.run('UPDATE vehicles SET status = ? WHERE id = ?', 'available', vehicleId);
    await db.run('DELETE FROM reservations WHERE id = ?', Number(req.params.id));
    return res.json({ message: 'Reserva concluída e removida' });
  }

  res.json({ message: 'Reserva atualizada' });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', Number(req.params.id));
  if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });
  await db.run('DELETE FROM reservations WHERE id = ?', Number(req.params.id));
  await db.run('UPDATE vehicles SET status = ? WHERE id = ?', 'available', reservation.vehicleId);

  res.json({ message: 'Reserva cancelada' });
});

export default router;
