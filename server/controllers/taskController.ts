import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb, logAction } from '../config/db';

function mapTask(t: any) {
  if (!t) return t;
  return {
    ...t,
    assignedDate: t.assigned_date,
    startedAt: t.started_at,
    completedAt: t.completed_at,
    completedBy: t.completed_by
  };
}

export async function getMyTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ error: 'Employee profile not found.' });
      return;
    }

    const db = await getDb();
    const tasks = await db.all(
      'SELECT * FROM tasks WHERE employee_id = ? ORDER BY due_date ASC',
      [employeeId]
    );

    res.json({ tasks: tasks.map(mapTask) });
  } catch (err: any) {
    console.error('Get my tasks error:', err);
    res.status(500).json({ error: 'Internal server error retrieving tasks.' });
  }
}

export async function getEmployeeTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const db = await getDb();
    const tasks = await db.all(
      'SELECT * FROM tasks WHERE employee_id = ? ORDER BY due_date ASC',
      [employeeId]
    );

    res.json({ tasks: tasks.map(mapTask) });
  } catch (err: any) {
    console.error('Get employee tasks error:', err);
    res.status(500).json({ error: 'Internal server error retrieving tasks.' });
  }
}

export async function getTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const db = await getDb();
    const tasks = await db.all(`
      SELECT t.*, e.first_name, e.last_name, e.employee_id as emp_id
      FROM tasks t
      LEFT JOIN employees e ON t.employee_id = e.id
      ORDER BY t.due_date ASC
    `);

    res.json({ tasks: tasks.map(mapTask) });
  } catch (err: any) {
    console.error('Get all tasks error:', err);
    res.status(500).json({ error: 'Internal server error retrieving all tasks.' });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { employee_id, title, description, priority, due_date } = req.body;

    if (!employee_id || !title || !priority || !due_date) {
      res.status(400).json({ error: 'Employee, title, priority, and due date are required.' });
      return;
    }

    const db = await getDb();
    const assigned_by = req.user?.email || req.user?.role || 'Admin';
    const nowIso = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO tasks (employee_id, assigned_by, title, description, priority, status, due_date, assigned_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, assigned_by, title, description || null, priority, 'PENDING', due_date, nowIso]
    );

    const emp = await db.get('SELECT first_name, last_name FROM employees WHERE id = ?', [employee_id]);
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : `ID ${employee_id}`;

    // Log task assigned
    await logAction('TASK', 'ASSIGNED', `Task "${title}" assigned to ${empName}`);

    res.status(201).json({
      success: true,
      task: mapTask({
        id: result.lastID,
        employee_id,
        assigned_by,
        title,
        description,
        priority,
        status: 'PENDING',
        due_date,
        assigned_date: nowIso,
        started_at: null,
        completed_at: null,
        completed_by: null,
      }),
    });
  } catch (err: any) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error creating task.' });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { employee_id, title, description, priority, due_date, status } = req.body;

    if (!employee_id || !title || !priority || !due_date || !status) {
      res.status(400).json({ error: 'Employee, title, priority, due date, and status are required.' });
      return;
    }

    const db = await getDb();
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    let started_at = task.started_at;
    let completed_at = task.completed_at;
    let completed_by = task.completed_by;

    if (status === 'IN_PROGRESS') {
      if (!started_at) {
        started_at = new Date().toISOString();
      }
      completed_at = null;
      completed_by = null;
    } else if (status === 'COMPLETED') {
      if (!started_at) {
        started_at = new Date().toISOString();
      }
      if (!completed_at) {
        completed_at = new Date().toISOString();
        const emp = await db.get('SELECT first_name, last_name FROM employees WHERE id = ?', [employee_id]);
        completed_by = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee';
      }
    } else {
      started_at = null;
      completed_at = null;
      completed_by = null;
    }

    await db.run(
      `UPDATE tasks 
       SET employee_id = ?, title = ?, description = ?, priority = ?, due_date = ?, status = ?,
           started_at = ?, completed_at = ?, completed_by = ?
       WHERE id = ?`,
      [employee_id, title, description || null, priority, due_date, status, started_at, completed_at, completed_by, id]
    );

    res.json({ success: true, message: 'Task updated successfully.' });
  } catch (err: any) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error updating task.' });
  }
}

export async function updateTaskStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      res.status(400).json({ error: 'Invalid task status.' });
      return;
    }

    const db = await getDb();
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    // Employees can only update their own tasks
    if (req.user?.role === 'Employee' && task.employee_id !== req.user.employeeId) {
      res.status(403).json({ error: 'Forbidden: You cannot update other employees\' tasks.' });
      return;
    }

    const nowIso = new Date().toISOString();
    let logMessage = '';

    if (status === 'IN_PROGRESS') {
      await db.run(
        'UPDATE tasks SET status = ?, started_at = ?, completed_at = NULL, completed_by = NULL WHERE id = ?',
        [status, nowIso, id]
      );
      logMessage = `Task "${task.title}" started.`;
    } else if (status === 'COMPLETED') {
      let completedBy = '';
      if (req.user?.role === 'Employee') {
        const emp = await db.get('SELECT first_name, last_name FROM employees WHERE id = ?', [task.employee_id]);
        completedBy = emp ? `${emp.first_name} ${emp.last_name}` : (req.user?.email || 'Employee');
      } else {
        completedBy = req.user?.email || 'Admin/HR';
      }
      await db.run(
        'UPDATE tasks SET status = ?, completed_at = ?, completed_by = ?, started_at = COALESCE(started_at, ?) WHERE id = ?',
        [status, nowIso, completedBy, nowIso, id]
      );
      logMessage = `${completedBy} completed "${task.title}".`;
    } else {
      await db.run(
        'UPDATE tasks SET status = ?, started_at = NULL, completed_at = NULL, completed_by = NULL WHERE id = ?',
        [status, id]
      );
      logMessage = `Task "${task.title}" reset to pending.`;
    }

    // Log the status update
    await logAction('TASK', status, logMessage);

    res.json({ success: true, message: 'Task status updated.' });
  } catch (err: any) {
    console.error('Update task status error:', err);
    res.status(500).json({ error: 'Internal server error updating task status.' });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const db = await getDb();

    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err: any) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error deleting task.' });
  }
}
