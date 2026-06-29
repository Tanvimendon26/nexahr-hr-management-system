import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb, logAction } from '../config/db';

function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Try YYYY-MM-DD first
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  
  // Try DD/MM/YYYY
  const partsSlash = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (partsSlash) {
    const day = parseInt(partsSlash[1], 10);
    const month = parseInt(partsSlash[2], 10) - 1; // 0-indexed month
    const year = parseInt(partsSlash[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  // Try parsing directly as a fallback
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function applyLeave(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Employee' && req.user?.role !== 'HR') {
      res.status(403).json({ error: 'Only employees can apply for leaves.' });
      return;
    }

    const employeeId = req.user.employeeId;
    if (!employeeId) {
      res.status(400).json({ error: 'Employee profile not found.' });
      return;
    }

    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    const startObj = parseDate(start_date);
    const endObj = parseDate(end_date);

    if (!startObj || !endObj) {
      res.status(400).json({ error: 'Invalid date format.' });
      return;
    }

    if (startObj > endObj) {
      res.status(400).json({ error: 'Start date cannot be after end date.' });
      return;
    }

    const formattedStart = formatDateToYYYYMMDD(startObj);
    const formattedEnd = formatDateToYYYYMMDD(endObj);

    const db = await getDb();
    
    // Insert leave request
    const result = await db.run(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [employeeId, leave_type, formattedStart, formattedEnd, reason]
    );

    res.status(201).json({
      success: true,
      leaveRequest: {
        id: result.lastID,
        leave_type,
        start_date: formattedStart,
        end_date: formattedEnd,
        reason,
        status: 'PENDING',
      },
    });
  } catch (err: any) {
    console.error('Apply leave error:', err);
    res.status(500).json({ error: 'Internal server error applying for leave.' });
  }
}

export async function getMyLeaves(req: AuthenticatedRequest, res: Response) {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ error: 'Employee profile not found.' });
      return;
    }

    const db = await getDb();
    const leaves = await db.all(
      'SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY id DESC',
      [employeeId]
    );

    res.json({ leaves });
  } catch (err: any) {
    console.error('Get my leaves error:', err);
    res.status(500).json({ error: 'Internal server error fetching your leaves.' });
  }
}

export async function getCompanyLeaves(req: AuthenticatedRequest, res: Response) {
  try {
    const { status } = req.query;
    const db = await getDb();

    let query = `
      SELECT l.*, e.first_name, e.last_name, e.employee_id as emp_str_id, d.name as department_name, u.email as approved_by_email
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status as string);
    }

    query += ` ORDER BY l.id DESC`;

    const leaves = await db.all(query, params);
    res.json({ leaves });
  } catch (err: any) {
    console.error('Get company leaves error:', err);
    res.status(500).json({ error: 'Internal server error retrieving leave requests.' });
  }
}

export async function processLeave(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid process status.' });
      return;
    }

    const db = await getDb();
    const request = await db.get('SELECT * FROM leave_requests WHERE id = ?', [id]);

    if (!request) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'Leave request has already been processed.' });
      return;
    }

    await db.run(
      'UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?',
      [status, req.user?.id, id]
    );

    const emp = await db.get('SELECT e.first_name, e.last_name FROM employees e WHERE e.id = ?', [request.employee_id]);
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : `Employee ID ${request.employee_id}`;

    // Log leave processed
    await logAction(
      'LEAVE',
      status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      `Leave request for ${empName} was ${status.toLowerCase()}`
    );

    res.json({ success: true, message: `Leave request has been ${status.toLowerCase()}` });
  } catch (err: any) {
    console.error('Process leave error:', err);
    res.status(500).json({ error: 'Internal server error processing leave request.' });
  }
}
