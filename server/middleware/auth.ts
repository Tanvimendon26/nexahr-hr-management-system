import { Request, Response, NextFunction } from 'express';
import { getDb } from '../config/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'Admin' | 'HR' | 'Employee';
    employeeId?: number; // SQLite employee table auto-increment ID
    employeeStrId?: string; // e.g. "EMP-001"
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const db = await getDb();

    // Find session
    const session = await db.get(
      'SELECT s.user_id, s.expires_at, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
      [token]
    );

    if (!session) {
      res.status(401).json({ error: 'Unauthorized: Invalid token.' });
      return;
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      await db.run('DELETE FROM sessions WHERE token = ?', [token]);
      res.status(401).json({ error: 'Unauthorized: Session expired.' });
      return;
    }

    // Retrieve internal employee table ID and custom employee_id string if they exist
    let employeeId: number | undefined;
    let employeeStrId: string | undefined;

    const emp = await db.get('SELECT id, employee_id FROM employees WHERE user_id = ?', [session.user_id]);
    if (emp) {
      employeeId = emp.id;
      employeeStrId = emp.employee_id;
    }

    req.user = {
      id: session.user_id,
      email: session.email,
      role: session.role,
      employeeId,
      employeeStrId,
    };

    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error in authentication.' });
  }
}

export function requireRole(allowedRoles: ('Admin' | 'HR' | 'Employee')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Access denied.' });
      return;
    }

    next();
  };
}
