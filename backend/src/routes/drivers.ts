import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const db = getDb();
  const drivers = await db.all('SELECT id, name, department, email, phone, role, licenseValidUntil FROM users');
  res.json(drivers);
});

router.get('/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const driver = await db.get('SELECT id, name, department, email, phone, role, licenseValidUntil FROM users WHERE id = ?', Number(req.params.id));
  if (!driver) return res.status(404).json({ message: 'Condutor não encontrado' });
  res.json(driver);
});

router.post('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  const { name, department, email, phone, role, licenseValidUntil, password } = req.body;
  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const db = getDb();
  const result = await db.run('INSERT INTO users (name, department, email, phone, role, licenseValidUntil, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?)', name, department, email, phone, role, licenseValidUntil, passwordHash);
  res.status(201).json({ id: result.lastID });
});

router.put('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  const { name, department, email, phone, role, licenseValidUntil, password } = req.body;
  const db = getDb();
  const current = await db.get('SELECT * FROM users WHERE id = ?', Number(req.params.id));
  if (!current) return res.status(404).json({ message: 'Condutor não encontrado' });

  const passwordHash = password ? bcrypt.hashSync(password, 10) : current.passwordHash;
  await db.run('UPDATE users SET name = ?, department = ?, email = ?, phone = ?, role = ?, licenseValidUntil = ?, passwordHash = ? WHERE id = ?', name || current.name, department || current.department, email || current.email, phone || current.phone, role || current.role, licenseValidUntil || current.licenseValidUntil, passwordHash, Number(req.params.id));
  res.json({ message: 'Condutor atualizado' });
});

router.delete('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  const db = getDb();
  const result = await db.run('DELETE FROM users WHERE id = ?', Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ message: 'Condutor não encontrado' });
  res.json({ message: 'Condutor removido' });
});

export default router;
