import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../config/db';

function convertToCSV(data: any[], headers: string[], keys: string[]): string {
  const csvRows: string[] = [];
  // UTF-8 BOM for Excel support
  csvRows.push('\uFEFF' + headers.join(','));
  
  for (const row of data) {
    const values = keys.map(key => {
      const val = row[key] === null || row[key] === undefined ? '' : row[key];
      // Escape quotes and handle line breaks
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\r\n');
}

export async function getEmployeeReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { format } = req.query; // 'json' or 'csv'
    const db = await getDb();

    const employees = await db.all(`
      SELECT e.employee_id, e.first_name, e.last_name, e.email, e.phone, 
             d.name as department_name, e.position, e.salary, e.joining_date, e.status
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.employee_id ASC
    `);

    if (format === 'csv') {
      const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Position', 'Salary', 'Joining Date', 'Status'];
      const keys = ['employee_id', 'first_name', 'last_name', 'email', 'phone', 'department_name', 'position', 'salary', 'joining_date', 'status'];
      
      const csvContent = convertToCSV(employees, headers, keys);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=employees_report.csv');
      res.send(csvContent);
      return;
    }

    res.json({ employees });
  } catch (err: any) {
    console.error('Employee report error:', err);
    res.status(500).json({ error: 'Internal server error generating employee report.' });
  }
}

export async function getAttendanceReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { format, start_date, end_date } = req.query;
    const db = await getDb();

    let query = `
      SELECT a.date, e.employee_id, e.first_name || ' ' || e.last_name as full_name,
             a.clock_in, a.clock_out, a.status, d.name as department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ` AND a.date >= ?`;
      params.push(start_date as string);
    }
    if (end_date) {
      query += ` AND a.date <= ?`;
      params.push(end_date as string);
    }

    query += ` ORDER BY a.date DESC, e.employee_id ASC`;

    const records = await db.all(query, params);

    if (format === 'csv') {
      const headers = ['Date', 'Employee ID', 'Full Name', 'Department', 'Clock In', 'Clock Out', 'Status'];
      const keys = ['date', 'employee_id', 'full_name', 'department_name', 'clock_in', 'clock_out', 'status'];
      
      const csvContent = convertToCSV(records, headers, keys);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
      res.send(csvContent);
      return;
    }

    res.json({ records });
  } catch (err: any) {
    console.error('Attendance report error:', err);
    res.status(500).json({ error: 'Internal server error generating attendance report.' });
  }
}

export async function getLeaveReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { format, status } = req.query;
    const db = await getDb();

    let query = `
      SELECT e.employee_id, e.first_name || ' ' || e.last_name as full_name,
             l.leave_type, l.start_date, l.end_date, l.reason, l.status, l.created_at
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status as string);
    }

    query += ` ORDER BY l.id DESC`;

    const leaves = await db.all(query, params);

    if (format === 'csv') {
      const headers = ['Employee ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status', 'Applied On'];
      const keys = ['employee_id', 'full_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'created_at'];
      
      const csvContent = convertToCSV(leaves, headers, keys);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=leave_report.csv');
      res.send(csvContent);
      return;
    }

    res.json({ leaves });
  } catch (err: any) {
    console.error('Leave report error:', err);
    res.status(500).json({ error: 'Internal server error generating leave report.' });
  }
}

// PDF Placeholder - modular design for future implementation
export async function getPdfReportPlaceholder(req: AuthenticatedRequest, res: Response) {
  // TODO: Implement PDF report creation using pdfkit or puppeteer in a future update
  res.json({
    success: false,
    message: 'PDF report generation is in development. Please use the CSV export option.',
    availableExports: ['CSV'],
  });
}
