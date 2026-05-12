import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { getDb } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../utils/email';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fleet-secret';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password são obrigatórios' });
  }

  const db = getDb();
  const user = await db.get('SELECT id, name, email, role, passwordHash FROM users WHERE email = ?', email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const passwordMatches = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Credenciais inválidos' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: '8h'
  });

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/register', async (req, res) => {
  const { name, email, password, phone, department, licenseValidUntil, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Nome, email, password e role são obrigatórios' });
  }

  const db = getDb();

  // Check if user already exists
  const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
  if (existingUser) {
    return res.status(400).json({ message: 'Este email já está em uso' });
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate verification token (expires in 1 hour)
  const verificationToken = randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  // Insert the new user
  const result = await db.run(
    'INSERT INTO users (name, email, passwordHash, phone, department, licenseValidUntil, role, email_verification_token, email_verification_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    name, email, passwordHash, phone || '', department || '', licenseValidUntil || '', role, verificationToken, verificationExpires
  );

  // Get the newly created user (without password)
  const newUser = await db.get(
    'SELECT id, name, email, role, phone, department, licenseValidUntil, email_verified FROM users WHERE id = ?',
    result.lastID
  );

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (emailError) {
    // Log email error but do not expose to user
    console.error('Failed to send verification email:', emailError);
  }

  // Generate JWT token
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, {
    expiresIn: '8h'
  });

  res.status(201).json({
    token,
    user: newUser
  });
});


// Verify email
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  const db = getDb();

  const user = await db.get(
    'SELECT id, email_verification_expires_at FROM users WHERE email_verification_token = ?',
    token
  );

  if (!user) {
    return res.status(400).json({ message: 'Token inválido ou expirado' });
  }

  const expires = new Date(user.email_verification_expires_at);
  if (expires < new Date()) {
    return res.status(400).json({ message: 'Token inválido ou expirado' });
  }

  // Mark email as verified and clear token
  await db.run(
    'UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires_at = NULL WHERE id = ?',
    user.id
  );

  res.json({ message: 'E-mail verificado com sucesso' });
});





// Delete authenticated user's account
router.delete('/me', requireAuth, async (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const result = await db.run('DELETE FROM users WHERE id = ?', userId);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Utilizador não encontrado' });
  }
  res.json({ message: 'Conta eliminada com sucesso' });
});

export default router;