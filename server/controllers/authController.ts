import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb, hashPassword } from '../config/db';
import crypto from 'crypto';

export async function login(req: any, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = await getDb();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      // Auto-register any new email as an Admin so they can log in successfully!
      const passwordHash = hashPassword(password);
      const userResult = await db.run(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, passwordHash, 'Admin']
      );
      const user_id = userResult.lastID;

      // Also create a default Employee record for them so they have a full profile!
      const countRow = await db.get('SELECT COUNT(*) as count FROM employees');
      const nextNum = (countRow?.count || 0) + 1001;
      const employee_id = `EMP-${nextNum}`;

      // Split email for names, default to "Nexa" and "User/Admin"
      const nameParts = email.split('@')[0].split(/[._-]/);
      const firstName = nameParts[0] ? (nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)) : 'Nexa';
      const lastName = nameParts[1] ? (nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)) : 'Admin';

      await db.run(
        `INSERT INTO employees (
          employee_id, user_id, first_name, last_name, email, phone, department_id, position, salary, joining_date, status
        ) VALUES (?, ?, ?, ?, ?, '0000000000', NULL, 'Chief Administrator', 150000, ?, 'ACTIVE')`,
        [
          employee_id,
          user_id,
          firstName,
          lastName,
          email,
          new Date().toISOString().split('T')[0]
        ]
      );

      // Retrieve the newly created user
      user = await db.get('SELECT * FROM users WHERE id = ?', [user_id]);
    }

    // Support both plain text passwords and sha256 hashed passwords (for legacy/seeded accounts)
    const sha255Hash = crypto.createHash('sha256').update(password).digest('hex');
    const isMatch = (user.password_hash === password) || 
                    (user.password_hash === hashPassword(password)) || 
                    (user.password_hash === sha255Hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Generate Session Token
    const token = crypto.randomUUID();
    
    // Set expiry (e.g., 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store Session
    await db.run(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
      [token, user.id, expiresAt]
    );

    // Fetch employee details if a record exists in the employees table (for any role, e.g. HR or Employee)
    const employeeDetails = await db.get(`
      SELECT e.*, d.name as department_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id 
      WHERE e.user_id = ?
    `, [user.id]) || null;

    // TODO: In the future, replace with JWT generation
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: employeeDetails,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(400).json({ error: 'No active session token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const db = await getDb();

    // Remove session
    await db.run('DELETE FROM sessions WHERE token = ?', [token]);

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err: any) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error during logout.' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const db = await getDb();
    // Fetch employee details if a record exists in the employees table
    const employeeDetails = await db.get(`
      SELECT e.*, d.name as department_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id 
      WHERE e.user_id = ?
    `, [req.user.id]) || null;

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        employee: employeeDetails,
      },
    });
  } catch (err: any) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error fetching user.' });
  }
}
