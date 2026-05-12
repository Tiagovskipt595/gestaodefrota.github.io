import express from 'express';
import { getDb } from '../db.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const db = getDb();
  const vehicles = await db.all('SELECT * FROM vehicles');
  res.json(vehicles);
});

router.get('/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', Number(req.params.id));
  if (!vehicle) return res.status(404).json({ message: 'Viatura não encontrada' });
  res.json(vehicle);
});

router.post('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  const { plate, brand, model, year, type, status, mileage, nextInspection, nextInsurance, nextService, notes } = req.body;
  const db = getDb();
  const result = await db.run(
    'INSERT INTO vehicles (plate, brand, model, year, type, status, mileage, nextInspection, nextInsurance, nextService, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    plate,
    brand,
    model,
    year,
    type,
    status,
    mileage,
    nextInspection,
    nextInsurance,
    nextService,
    notes
  );
  res.status(201).json({ id: result.lastID });
});

router.put('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  const { plate, brand, model, year, type, status, mileage, nextInspection, nextInsurance, nextService, notes } = req.body;
  const db = getDb();
  const result = await db.run(
    'UPDATE vehicles SET plate = ?, brand = ?, model = ?, year = ?, type = ?, status = ?, mileage = ?, nextInspection = ?, nextInsurance = ?, nextService = ?, notes = ? WHERE id = ?',
    plate,
    brand,
    model,
    year,
    type,
    status,
    mileage,
    nextInspection,
    nextInsurance,
    nextService,
    notes,
    Number(req.params.id)
  );
  if (result.changes === 0) return res.status(404).json({ message: 'Viatura não encontrada' });
  res.json({ message: 'Atualizado' });
});

router.delete('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  const db = getDb();
  const result = await db.run('DELETE FROM vehicles WHERE id = ?', Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Viatura não encontrada' });
  res.json({ message: 'Viatura removida' });
});

export default router;
