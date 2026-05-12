import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const main = async () => {
  const dbPath = path.resolve('data', 'fleet.db');
  const schemaPath = path.resolve(__dirname, './schema.sql');

  console.log('Schema path:', schemaPath);

  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  console.log('Schema SQL length:', schemaSql.length);
  console.log('Schema SQL first 100 chars:', schemaSql.substring(0, 100));

  // Split SQL by semicolon and execute each statement separately
  const statements = schemaSql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
  console.log(`Executing ${statements.length} SQL statements...`);
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i+1}: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
    try {
      await db.exec(statement);
      console.log(`Statement ${i+1} executed successfully`);
    } catch (stmtErr) {
      console.error(`Error executing statement ${i+1}:`, stmtErr);
      console.log(`Statement text: ${statement}`);
      throw stmtErr;
    }
  }

  console.log('Executing schema...');
  await db.exec(schemaSql);
  console.log('Schema executed successfully');

  console.log('Clearing existing data...');
  await db.exec('DELETE FROM alerts');
  await db.exec('DELETE FROM reservations');
  await db.exec('DELETE FROM vehicles');
  await db.exec('DELETE FROM users');
  console.log('Data cleared');

  // Reset auto-increment counters
  console.log('Resetting auto-increment counters...');
  await db.exec('DELETE FROM sqlite_sequence WHERE name IN (\'alerts\', \'reservations\', \'vehicles\', \'users\')');
  console.log('Auto-increment counters reset');

  const password = await bcrypt.hash('password', 10);
  console.log('Password hashed');

  // Insert users
  const users = [
    ['Administrador', 'Gestão', 'admin@example.com', '999-000-111', 'admin', '2027-12-31', password],
    ['Gestor de Frota', 'Operações', 'manager@example.com', '999-000-222', 'manager', '2025-10-15', password],
    ['Utilizador', 'Comercial', 'user@example.com', '999-000-333', 'user', '2026-03-01', password],
    ['João Silva', 'Logística', 'joao.silva@example.com', '999-000-444', 'user', '2026-06-15', password],
    ['Maria Santos', 'Vendas', 'maria.santos@example.com', '999-000-555', 'manager', '2027-01-10', password]
  ];

  console.log('Inserting users...');
  for (const user of users) {
    await db.run('INSERT INTO users (name, department, email, phone, role, licenseValidUntil, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?)', user);
  }
  console.log('Users inserted successfully');

  // Insert vehicles
  const vehicles = [
    ['ABC-1234', 'Toyota', 'Corolla', 2020, 'Sedan', 'available', 52000, '2025-06-15', '2025-10-01', '2025-09-01', 'Viatura de frota geral'],
    ['DEF-5678', 'Renault', 'Kangoo', 2018, 'Van', 'maintenance', 78000, '2024-09-30', '2024-11-10', '2024-11-05', 'Manutenção programada'],
    ['GHI-9012', 'BMW', 'X3', 2022, 'SUV', 'reserved', 26000, '2026-02-12', '2026-05-30', '2026-05-15', 'Reservada para equipa de vendas'],
    ['JKL-3456', 'Mercedes', 'Vito', 2021, 'Van', 'in_use', 35500, '2025-08-20', '2025-12-01', '2025-11-10', 'Em utilização'],
    ['MNO-7890', 'Volkswagen', 'Golf', 2019, 'Hatchback', 'available', 64200, '2025-07-01', '2025-11-15', '2025-10-20', 'Pronta para usar']
  ];

  console.log('Inserting vehicles...');
  for (const vehicle of vehicles) {
    await db.run('INSERT INTO vehicles (plate, brand, model, year, type, status, mileage, nextInspection, nextInsurance, nextService, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', vehicle);
  }
  console.log('Vehicles inserted successfully');

  // Create sample reservations for May 2026 (current month)
  console.log('Inserting reservations...');
  await db.run('INSERT INTO reservations (vehicleId, userId, startAt, endAt, purpose, destination, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [1, 3, '2026-05-10T09:00:00Z', '2026-05-10T18:00:00Z', 'Reunião com cliente', 'Lisboa', 'confirmed', 'Reserva para apresentação']);
  await db.run('INSERT INTO reservations (vehicleId, userId, startAt, endAt, purpose, destination, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [2, 4, '2026-05-15T08:00:00Z', '2026-05-16T18:00:00Z', 'Traslado de carga', 'Porto', 'confirmed', 'Viagem de duas dias']);
  await db.run('INSERT INTO reservations (vehicleId, userId, startAt, endAt, purpose, destination, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [3, 5, '2026-05-20T10:00:00Z', '2026-05-20T17:00:00Z', 'Visita ao fornecedor', 'Braga', 'confirmed', 'Check de qualidade']);
  await db.run('INSERT INTO reservations (vehicleId, userId, startAt, endAt, purpose, destination, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [4, 3, '2026-05-25T09:00:00Z', '2026-05-27T18:00:00Z', 'Evento corporativo', 'Vigo', 'confirmed', 'Viagem internacional']);
  await db.run('INSERT INTO reservations (vehicleId, userId, startAt, endAt, purpose, destination, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [5, 4, '2026-05-30T14:00:00Z', '2026-05-31T12:00:00Z', 'Entrega urgente', 'Faro', 'confirmed', 'Pedido especial']);
  console.log('Reservations inserted successfully');

  await db.run('INSERT INTO alerts (vehicleId, type, message, createdAt, resolved) VALUES (?, ?, ?, ?, ?)', [2, 'Manutenção', 'Revisão pendente na viatura DEF-5678', new Date().toISOString(), 0]);
  await db.run('INSERT INTO alerts (vehicleId, type, message, createdAt, resolved) VALUES (?, ?, ?, ?, ?)', [null, 'Carta', 'Carta de condução de Utilizador expira em breve', new Date().toISOString(), 0]);
  console.log('Alerts inserted successfully');

  console.log('Base de dados inicializada com dados de demonstração.');
};

main().catch(err => {
  console.error('Erro ao inicializar a base de dados:', err);
  process.exit(1);
});