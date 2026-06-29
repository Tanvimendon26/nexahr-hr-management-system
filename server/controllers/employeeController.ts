import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb, hashPassword, logAction } from '../config/db';
import crypto from 'crypto';

export async function createEmployee(req: AuthenticatedRequest, res: Response) {
  const db = await getDb();
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      position,
      salary,
      joining_date,
      role = 'Employee'
    } = req.body;

    let normalizedRole = 'Employee';
    if (role) {
      const upper = role.toString().toUpperCase();
      if (upper === 'HR') {
        normalizedRole = 'HR';
      } else if (upper === 'ADMIN') {
        normalizedRole = 'Admin';
      } else {
        normalizedRole = 'Employee';
      }
    }

    // Secure check: HR cannot create Admin accounts
    if (req.user?.role !== 'Admin' && normalizedRole === 'Admin') {
      res.status(403).json({ error: 'Forbidden: HR users cannot create Admin accounts.' });
      return;
    }

    // Field Validation
    if (!first_name || !last_name || !email || !phone || !position || !salary || !joining_date) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    // Check if email already exists
    const emailCheck = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (emailCheck) {
      res.status(400).json({ error: 'Email already registered in the system.' });
      return;
    }

    // Auto-generate unique Employee ID
    const countRow = await db.get('SELECT COUNT(*) as count FROM employees');
    const nextNum = (countRow?.count || 0) + 1001;
    const employee_id = `EMP-${nextNum}`;

    // Generate temporary password
    // TODO: In the future, send an automated email with this temp password
    const temporaryPassword = 'NEXA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const passwordHash = hashPassword(temporaryPassword);

    await db.run('BEGIN TRANSACTION');

    // Create User Account
    const userResult = await db.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, normalizedRole]
    );
    const user_id = userResult.lastID;

    // Create Employee Record
    const empResult = await db.run(
      `INSERT INTO employees (
        employee_id, user_id, first_name, last_name, email, phone, department_id, position, salary, joining_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        employee_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        department_id || null,
        position,
        parseFloat(salary),
        joining_date
      ]
    );

    await db.run('COMMIT');

    // Log employee creation
    await logAction(
      'HIRE',
      'CREATED',
      `Employee ${first_name} ${last_name} (${employee_id}) was created as ${position}`
    );

    res.status(201).json({
      success: true,
      employee: {
        id: empResult.lastID,
        employee_id,
        first_name,
        last_name,
        email,
        phone,
        department_id,
        position,
        salary,
        joining_date,
        status: 'ACTIVE',
        role: normalizedRole
      },
      temporaryPassword, // Displayed ONLY once here
    });

  } catch (err: any) {
    await db.run('ROLLBACK');
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Internal server error creating employee.' });
  }
}

export async function getEmployees(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, department_id, status, role, limit = 50, offset = 0 } = req.query;
    const db = await getDb();

    let query = `
      SELECT e.*, d.name as department_name, u.role as user_role
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_id LIKE ? OR e.position LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    if (department_id) {
      query += ` AND e.department_id = ?`;
      params.push(parseInt(department_id as string));
    }

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status as string);
    }

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role as string);
    }

    query += ` ORDER BY e.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const employees = await db.all(query, params);
    
    // Also return count for pagination
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_id LIKE ? OR e.position LIKE ?)`;
      const searchWild = `%${search}%`;
      countParams.push(searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    if (department_id) {
      countQuery += ` AND e.department_id = ?`;
      countParams.push(parseInt(department_id as string));
    }

    if (status) {
      countQuery += ` AND e.status = ?`;
      countParams.push(status as string);
    }

    if (role) {
      countQuery += ` AND u.role = ?`;
      countParams.push(role as string);
    }

    const totalRow = await db.get(countQuery, countParams);

    res.json({
      employees,
      total: totalRow?.count || 0
    });
  } catch (err: any) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Internal server error retrieving employees.' });
  }
}

export async function getEmployeeById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const db = await getDb();

    const employee = await db.get(
      `SELECT e.*, d.name as department_name, u.role as user_role
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id]
    );

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    res.json({ employee });
  } catch (err: any) {
    console.error('Get employee by ID error:', err);
    res.status(500).json({ error: 'Internal server error retrieving employee.' });
  }
}

export async function updateEmployee(req: AuthenticatedRequest, res: Response) {
  const db = await getDb();
  try {
    const id = parseInt(req.params.id);
    const {
      first_name,
      last_name,
      phone,
      department_id,
      position,
      salary,
      joining_date,
      status,
      role
    } = req.body;

    if (!first_name || !last_name || !phone || !position || !salary || !joining_date || !status) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    // Get current employee
    const currentEmp = await db.get('SELECT user_id, email FROM employees WHERE id = ?', [id]);
    if (!currentEmp) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    await db.run('BEGIN TRANSACTION');

    // Update Employee record
    await db.run(
      `UPDATE employees 
       SET first_name = ?, last_name = ?, phone = ?, department_id = ?, position = ?, salary = ?, joining_date = ?, status = ?
       WHERE id = ?`,
      [
        first_name,
        last_name,
        phone,
        department_id || null,
        position,
        parseFloat(salary),
        joining_date,
        status,
        id
      ]
    );

    let normalizedRole = undefined;
    if (role) {
      const upper = role.toString().toUpperCase();
      if (upper === 'HR') {
        normalizedRole = 'HR';
      } else if (upper === 'ADMIN') {
        normalizedRole = 'Admin';
      } else {
        normalizedRole = 'Employee';
      }
    }

    // HR cannot modify admin accounts/roles or set anyone to Admin
    if (req.user?.role !== 'Admin') {
      const targetUser = await db.get('SELECT role FROM users WHERE id = ?', [currentEmp.user_id]);
      if (targetUser?.role === 'Admin' || normalizedRole === 'Admin') {
        res.status(403).json({ error: 'Forbidden: HR users cannot modify Admin roles.' });
        return;
      }
    }

    // Update corresponding User role if specified (ADMIN can adjust roles)
    if (normalizedRole && currentEmp.user_id) {
      await db.run('UPDATE users SET role = ? WHERE id = ?', [normalizedRole, currentEmp.user_id]);
    }

    await db.run('COMMIT');

    // Log employee update
    await logAction(
      'EMPLOYEE',
      'UPDATED',
      `Employee ${first_name} ${last_name} was updated`
    );

    res.json({
      success: true,
      message: 'Employee updated successfully.'
    });
  } catch (err: any) {
    await db.run('ROLLBACK');
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Internal server error updating employee.' });
  }
}

export async function deleteEmployee(req: AuthenticatedRequest, res: Response) {
  const db = await getDb();
  try {
    const id = parseInt(req.params.id);

    const emp = await db.get('SELECT user_id, email FROM employees WHERE id = ?', [id]);
    if (!emp) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    // Prevent Admin deleting themselves if they are mapped to an employee
    if (req.user?.id === emp.user_id) {
      res.status(400).json({ error: 'Cannot delete your own admin employee account.' });
      return;
    }

    await db.run('BEGIN TRANSACTION');

    // Delete User (will cascade to employee or delete employee separately)
    if (emp.user_id) {
      await db.run('DELETE FROM users WHERE id = ?', [emp.user_id]);
    }
    await db.run('DELETE FROM employees WHERE id = ?', [id]);

    await db.run('COMMIT');

    // Log employee deletion
    await logAction(
      'EMPLOYEE',
      'DELETED',
      `Employee ${emp.email} was deleted`
    );

    res.json({ success: true, message: 'Employee and user account deleted successfully.' });
  } catch (err: any) {
    await db.run('ROLLBACK');
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Internal server error deleting employee.' });
  }
}
