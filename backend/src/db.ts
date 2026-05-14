import { Pool } from 'pg';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { config as dotenvConfig } from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenvConfig();

let db: any;

export async function initDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    // Use PostgreSQL
    const pgPool = new Pool({ connectionString: databaseUrl });
    // Verify connection
    await pgPool.query('SELECT NOW()');
    db = pgPool;
    return db;
  } else {
    // Fallback to SQLite
    const dataDirectory = process.env.DATA_DIR
      ? process.env.DATA_DIR
      : path.resolve('data');
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    const dbPath = path.join(dataDirectory, 'fleet.db');
    const sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    await sqliteDb.exec('PRAGMA foreign_keys = ON');
    db = sqliteDb;
    return db;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}