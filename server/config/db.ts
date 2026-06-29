import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import crypto from 'crypto';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// Keep authentication simple using plain text passwords for now
export function hashPassword(password: string): string {
  return password;
}

export async function getDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!db) {
    const dbPath = path.resolve(process.cwd(), 'nexahr.db');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    
    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

export async function initDb() {
  const activeDb = await getDb();

  // Auto-migration: Drop tables with old uppercase constraints so they recreate cleanly
  const schema = await activeDb.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  if (schema && schema.sql && schema.sql.includes("'ADMIN'")) {
    console.log('Migrating users and dependent tables to new case-sensitive roles...');
    await activeDb.exec('DROP TABLE IF EXISTS sessions');
    await activeDb.exec('DROP TABLE IF EXISTS leave_requests');
    await activeDb.exec('DROP TABLE IF EXISTS employees');
    await activeDb.exec('DROP TABLE IF EXISTS users');
  }

  // Auto-migration for tasks table to include priority, assigned_by, assigned_date, and started_at columns
  const taskSchema = await activeDb.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'");
  if (taskSchema && taskSchema.sql && (!taskSchema.sql.includes('priority') || !taskSchema.sql.includes('started_at') || !taskSchema.sql.includes('assigned_date'))) {
    console.log('Migrating tasks table to include detailed workflow columns...');
    await activeDb.exec('DROP TABLE IF EXISTS tasks');
  }

  // Auto-migration for attendance table to include working_hours and relaxed status check constraint
  const attSchema = await activeDb.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='attendance'");
  if (attSchema && attSchema.sql && !attSchema.sql.includes('working_hours')) {
    console.log('Migrating attendance table to include working_hours column...');
    await activeDb.exec('DROP TABLE IF EXISTS attendance');
  }

  // 1. Create Departments Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Create Users Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'HR', 'Employee')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);


  // 3. Create Employees Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      user_id INTEGER UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      department_id INTEGER,
      position TEXT NOT NULL,
      salary REAL NOT NULL,
      joining_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
    )
  `);

  // 4. Create Attendance Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      working_hours TEXT,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
      UNIQUE(employee_id, date)
    )
  `);

  // 5. Create Leave Requests Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL CHECK (leave_type IN ('SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'UNPAID')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
      approved_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
    )
  `);

  // 6. Create Tasks Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      assigned_by TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
      due_date TEXT NOT NULL,
      assigned_date TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      completed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
    )
  `);

  // 7. Create Holidays Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      holiday_name TEXT NOT NULL,
      holiday_date TEXT NOT NULL,
      description TEXT
    )
  `);

  // Seed Holidays if empty
  const holidayCount = await activeDb.get('SELECT COUNT(*) as count FROM holidays');
  if (holidayCount && holidayCount.count === 0) {
    await activeDb.run(
      'INSERT INTO holidays (holiday_name, holiday_date, description) VALUES (?, ?, ?)',
      ['Independence Day', '2026-08-15', 'National Independence Day celebration']
    );
    await activeDb.run(
      'INSERT INTO holidays (holiday_name, holiday_date, description) VALUES (?, ?, ?)',
      ['Labor Day', '2026-09-07', 'Labor Day holiday']
    );
    await activeDb.run(
      'INSERT INTO holidays (holiday_name, holiday_date, description) VALUES (?, ?, ?)',
      ['Christmas', '2026-12-25', 'Christmas Day holiday']
    );
    await activeDb.run(
      'INSERT INTO holidays (holiday_name, holiday_date, description) VALUES (?, ?, ?)',
      ['New Year\'s Day', '2027-01-01', 'New Year celebration']
    );
  }

  // 8. Create Sessions Table for cookie-less or headers-based local sessions
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 8. Create Platform Action Logs Table
  await activeDb.exec(`
    CREATE TABLE IF NOT EXISTS action_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Admin user if empty
  const adminEmail = 'admin@nexahr.com';
  const existingAdmin = await activeDb.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const adminPasswordHash = hashPassword('admin123');
    await activeDb.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [adminEmail, adminPasswordHash, 'Admin']
    );
    console.log('Seeded Admin account (admin@nexahr.com / admin123).');
  }
}

export async function logAction(type: string, action: string, description: string) {
  try {
    const activeDb = await getDb();
    await activeDb.run(
      'INSERT INTO action_logs (type, action, description) VALUES (?, ?, ?)',
      [type, action, description]
    );
  } catch (err) {
    console.error('Failed to log action:', err);
  }
}
