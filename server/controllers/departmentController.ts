import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb, logAction } from '../config/db';

export async function createDepartment(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Department name is required.' });
      return;
    }

    const db = await getDb();

    // Check duplicate name
    const dup = await db.get('SELECT id FROM departments WHERE name = ?', [name]);
    if (dup) {
      res.status(400).json({ error: 'Department name already exists.' });
      return;
    }

    const result = await db.run(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    // Log department created
    await logAction('DEPARTMENT', 'CREATED', `Department ${name} was created`);

    res.status(201).json({
      success: true,
      department: {
        id: result.lastID,
        name,
        description,
      },
    });
  } catch (err: any) {
    console.error('Create department error:', err);
    res.status(500).json({ error: 'Internal server error creating department.' });
  }
}

export async function getDepartments(req: AuthenticatedRequest, res: Response) {
  try {
    const { search } = req.query;
    const db = await getDb();

    let query = `
      SELECT d.*, 
             (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id) as employee_count
      FROM departments d
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND d.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY d.name ASC`;

    const departments = await db.all(query, params);
    res.json({ departments });
  } catch (err: any) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Internal server error retrieving departments.' });
  }
}

export async function updateDepartment(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Department name is required.' });
      return;
    }

    const db = await getDb();

    // Check duplicate name excluding current
    const dup = await db.get('SELECT id FROM departments WHERE name = ? AND id != ?', [name, id]);
    if (dup) {
      res.status(400).json({ error: 'Department name already exists.' });
      return;
    }

    await db.run(
      'UPDATE departments SET name = ?, description = ? WHERE id = ?',
      [name, description || null, id]
    );

    // Log department updated
    await logAction('DEPARTMENT', 'UPDATED', `Department ${name} was updated`);

    res.json({ success: true, message: 'Department updated successfully.' });
  } catch (err: any) {
    console.error('Update department error:', err);
    res.status(500).json({ error: 'Internal server error updating department.' });
  }
}

export async function deleteDepartment(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const db = await getDb();

    const dept = await db.get('SELECT name FROM departments WHERE id = ?', [id]);
    if (!dept) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    // Check if contains active employees
    const empCount = await db.get('SELECT COUNT(*) as count FROM employees WHERE department_id = ?', [id]);
    if (empCount && empCount.count > 0) {
      res.status(400).json({ error: 'Cannot delete department. It contains active employees.' });
      return;
    }

    await db.run('DELETE FROM departments WHERE id = ?', [id]);

    // Log department deleted
    await logAction('DEPARTMENT', 'DELETED', `Department ${dept.name} was deleted`);
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (err: any) {
    console.error('Delete department error:', err);
    res.status(500).json({ error: 'Internal server error deleting department.' });
  }
}
