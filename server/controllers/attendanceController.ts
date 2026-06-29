import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb, logAction } from '../config/db';

// Helper to calculate working hours as 'XXh YYm'
function calculateWorkingHours(clockInStr: string, clockOutStr: string): string {
  try {
    if (!clockInStr || !clockOutStr) return '00h 00m';
    const [inH, inM, inS] = clockInStr.split(':').map(Number);
    const [outH, outM, outS] = clockOutStr.split(':').map(Number);

    const inTotalSeconds = inH * 3600 + (inM || 0) * 60 + (inS || 0);
    const outTotalSeconds = outH * 3600 + (outM || 0) * 60 + (outS || 0);

    const diffSeconds = Math.max(0, outTotalSeconds - inTotalSeconds);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);

    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  } catch (err) {
    console.error('Error calculating working hours:', err);
    return '00h 00m';
  }
}

// 1. Clock In
export async function clockIn(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Employee' && req.user?.role !== 'HR' && req.user?.role !== 'Admin') {
      res.status(403).json({ error: 'Only employees can clock in.' });
      return;
    }

    const employeeId = req.user.employeeId;
    if (!employeeId) {
      res.status(400).json({ error: 'Employee profile not found.' });
      return;
    }

    const db = await getDb();
    
    // Get local date and time
    const now = new Date();
    const localDate = req.body.date || now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const localTime = req.body.clock_in || now.toTimeString().split(' ')[0]; // HH:MM:SS

    // Check if already clocked in for today
    const existing = await db.get(
      'SELECT id, status FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, localDate]
    );

    if (existing) {
      res.status(400).json({ error: 'You have already clocked in for today.' });
      return;
    }

    // Set status to PRESENT or LATE (9:15 AM threshold)
    let status = 'PRESENT';
    if (localTime) {
      const [h, m] = localTime.split(':').map(Number);
      if (h > 9 || (h === 9 && m > 15)) {
        status = 'LATE';
      }
    }

    await db.run(
      `INSERT INTO attendance (employee_id, date, clock_in, clock_out, working_hours, status)
       VALUES (?, ?, ?, NULL, '00h 00m', ?)`,
      [employeeId, localDate, localTime, status]
    );

    // Log action
    const empName = req.user?.email.split('@')[0] || `Employee ${employeeId}`;
    await logAction('ATTENDANCE', 'RECORDED', `${empName} clocked in`);

    res.status(201).json({
      success: true,
      clockIn: localTime,
      clock_in: localTime,
      date: localDate,
      status,
      workingHours: '00h 00m',
      working_hours: '00h 00m',
    });
  } catch (err: any) {
    console.error('Clock in error:', err);
    res.status(500).json({ error: 'Internal server error during clock in.' });
  }
}

// 2. Clock Out
export async function clockOut(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Employee' && req.user?.role !== 'HR' && req.user?.role !== 'Admin') {
      res.status(403).json({ error: 'Only employees can clock out.' });
      return;
    }

    const employeeId = req.user.employeeId;
    if (!employeeId) {
      res.status(400).json({ error: 'Employee profile not found.' });
      return;
    }

    const db = await getDb();
    const now = new Date();
    const localDate = req.body.date || now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const localTime = req.body.clock_out || now.toTimeString().split(' ')[0]; // HH:MM:SS

    // Check if clocked in for today
    const existing = await db.get(
      'SELECT id, clock_in, clock_out FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, localDate]
    );

    if (!existing) {
      res.status(400).json({ error: 'You must clock in first before clocking out.' });
      return;
    }

    if (existing.clock_out) {
      res.status(400).json({ error: 'You have already clocked out for today.' });
      return;
    }

    const clockInTime = existing.clock_in || '09:00:00';
    const workingHours = calculateWorkingHours(clockInTime, localTime);

    // Update attendance record: change status to COMPLETED and save working hours
    await db.run(
      'UPDATE attendance SET clock_out = ?, working_hours = ?, status = ? WHERE id = ?',
      [localTime, workingHours, 'COMPLETED', existing.id]
    );

    // Log action
    const empName = req.user?.email.split('@')[0] || `Employee ${employeeId}`;
    await logAction('ATTENDANCE', 'RECORDED', `${empName} clocked out (Completed)`);

    res.json({
      success: true,
      clockOut: localTime,
      clock_out: localTime,
      workingHours,
      working_hours: workingHours,
      status: 'COMPLETED',
    });
  } catch (err: any) {
    console.error('Clock out error:', err);
    res.status(500).json({ error: 'Internal server error during clock out.' });
  }
}

// 3. Get Logged-in Employee Attendance History
export async function getMyAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ error: 'Employee profile not found.' });
      return;
    }

    const db = await getDb();
    const rows = await db.all(
      'SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 300',
      [employeeId]
    );

    // Map rows to make both snake_case and camelCase available
    const history = rows.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      employee_id: row.employee_id,
      date: row.date,
      clockIn: row.clock_in,
      clock_in: row.clock_in,
      clockOut: row.clock_out,
      clock_out: row.clock_out,
      workingHours: row.working_hours || '00h 00m',
      working_hours: row.working_hours || '00h 00m',
      status: row.status,
      createdAt: row.created_at,
      created_at: row.created_at,
    }));

    res.json({ history });
  } catch (err: any) {
    console.error('Get my attendance error:', err);
    res.status(500).json({ error: 'Internal server error fetching attendance.' });
  }
}

// 4. Get Company-Wide Attendance (For HR / Admin)
export async function getCompanyAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { date, status, search, department_id } = req.query;
    const db = await getDb();

    let query = `
      SELECT a.*, e.first_name, e.last_name, e.employee_id as emp_str_id, d.name as department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date as string);
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status as string);
    }

    if (department_id) {
      query += ` AND e.department_id = ?`;
      params.push(parseInt(department_id as string));
    }

    if (search) {
      query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY a.date DESC, a.clock_in DESC LIMIT 500`;

    const rows = await db.all(query, params);

    const records = rows.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      employee_id: row.employee_id,
      date: row.date,
      clockIn: row.clock_in,
      clock_in: row.clock_in,
      clockOut: row.clock_out,
      clock_out: row.clock_out,
      workingHours: row.working_hours || '00h 00m',
      working_hours: row.working_hours || '00h 00m',
      status: row.status,
      createdAt: row.created_at,
      created_at: row.created_at,
      employee: {
        first_name: row.first_name,
        last_name: row.last_name,
        employee_id: row.emp_str_id,
        department_name: row.department_name,
      },
      first_name: row.first_name,
      last_name: row.last_name,
      emp_str_id: row.emp_str_id,
      department_name: row.department_name,
    }));

    res.json({ records });
  } catch (err: any) {
    console.error('Get company attendance error:', err);
    res.status(500).json({ error: 'Internal server error retrieving company attendance.' });
  }
}

// 5. Admin manual check-in or status override (Attendance Edit)
export async function updateAttendanceStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { status, clock_in, clock_out, date } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }

    const db = await getDb();
    
    // Check if record exists
    const existing = await db.get('SELECT a.*, e.first_name, e.last_name FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE a.id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }

    const nameStr = `${existing.first_name} ${existing.last_name}`;
    const clockInTime = clock_in || existing.clock_in || '09:00:00';
    const clockOutTime = clock_out || existing.clock_out || null;
    const workingHours = clockOutTime ? calculateWorkingHours(clockInTime, clockOutTime) : '00h 00m';

    await db.run(
      'UPDATE attendance SET status = ?, clock_in = ?, clock_out = ?, working_hours = ?, date = COALESCE(?, date) WHERE id = ?',
      [status, clock_in || null, clockOutTime, workingHours, date || null, id]
    );

    await logAction('ATTENDANCE', 'UPDATED', `Attendance manually updated for ${nameStr}`);

    res.json({ success: true, message: 'Attendance status updated successfully.' });
  } catch (err: any) {
    console.error('Update attendance status error:', err);
    res.status(500).json({ error: 'Internal server error updating attendance.' });
  }
}

// 6. Delete Attendance Record (HR / Admin)
export async function deleteAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const db = await getDb();

    const existing = await db.get(
      'SELECT a.*, e.first_name, e.last_name FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE a.id = ?',
      [id]
    );

    if (!existing) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }

    await db.run('DELETE FROM attendance WHERE id = ?', [id]);

    await logAction('ATTENDANCE', 'DELETED', `Attendance deleted for ${existing.first_name} ${existing.last_name} on ${existing.date}`);

    res.json({ success: true, message: 'Attendance record deleted successfully.' });
  } catch (err: any) {
    console.error('Delete attendance error:', err);
    res.status(500).json({ error: 'Internal server error deleting attendance.' });
  }
}
