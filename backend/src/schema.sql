BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  department TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  licenseValidUntil TEXT,
  passwordHash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT 0,
  email_verification_token TEXT,
  email_verification_expires_at TEXT,
  password_reset_token TEXT,
  password_reset_expires_at TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  nextInspection TEXT,
  nextInsurance TEXT,
  nextService TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicleId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  startAt TEXT NOT NULL,
  endAt TEXT NOT NULL,
  pickupAt TEXT,
  dropoffAt TEXT,
  startMileage INTEGER,
  endMileage INTEGER,
  fuelStart TEXT,
  fuelEnd TEXT,
  purpose TEXT,
  destination TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicleId INTEGER,
  userId INTEGER,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

COMMIT;
