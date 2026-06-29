import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../config/db';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const db = await getDb();
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    // 1. Total Employees
    const totalEmployeesRow = await db.get('SELECT COUNT(*) as count FROM employees');
    const totalEmployees = totalEmployeesRow?.count || 0;

    // 2. Total Departments
    const totalDepartmentsRow = await db.get('SELECT COUNT(*) as count FROM departments');
    const totalDepartments = totalDepartmentsRow?.count || 0;

    // 3. Active Employees
    const activeEmployeesRow = await db.get("SELECT COUNT(*) as count FROM employees WHERE status = 'ACTIVE'");
    const activeEmployees = activeEmployeesRow?.count || 0;

    // 4. Inactive Employees
    const inactiveEmployeesRow = await db.get("SELECT COUNT(*) as count FROM employees WHERE status = 'INACTIVE'");
    const inactiveEmployees = inactiveEmployeesRow?.count || 0;

    // 5. Today's Attendance
    const todayAttendanceRow = await db.get(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status IN ('PRESENT', 'LATE', 'HALF_DAY')",
      [todayStr]
    );
    const todayAttendance = todayAttendanceRow?.count || 0;

    // 6. Pending Leave Requests
    const pendingLeavesRow = await db.get("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'PENDING'");
    const pendingLeaves = pendingLeavesRow?.count || 0;

    // 7. Employees by Department Chart Data
    const deptDistribution = await db.all(`
      SELECT d.name as department, COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'ACTIVE'
      GROUP BY d.id, d.name
    `);

    // 8. Monthly Joining Trend Chart Data
    // Grouping by YYYY-MM
    const joiningTrend = await db.all(`
      SELECT substr(joining_date, 1, 7) as month, COUNT(*) as count
      FROM employees
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12
    `);

    // 9. Recent Employees Widget
    const recentEmployees = await db.all(`
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.id DESC
      LIMIT 5
    `);

    // 10. Dynamic Activity Stream (from action_logs table with Union fallback)
    let activities = await db.all(`
      SELECT type, description, created_at as timestamp
      FROM action_logs
      ORDER BY id DESC
      LIMIT 10
    `);

    if (!activities || activities.length === 0) {
      activities = await db.all(`
        SELECT 'HIRE' as type, 
               first_name || ' ' || last_name || ' joined as ' || position as description, 
               created_at as timestamp
        FROM employees
        
        UNION ALL
        
        SELECT 'ATTENDANCE' as type, 
               e.first_name || ' ' || e.last_name || ' clocked in (' || a.status || ')' as description, 
               a.created_at as timestamp
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        
        UNION ALL
        
        SELECT 'LEAVE' as type, 
               e.first_name || ' ' || e.last_name || ' applied for ' || l.leave_type || ' leave' as description, 
               l.created_at as timestamp
        FROM leave_requests l
        JOIN employees e ON l.employee_id = e.id
        
        ORDER BY timestamp DESC
        LIMIT 10
      `);
    }

    res.json({
      stats: {
        totalEmployees,
        totalDepartments,
        activeEmployees,
        inactiveEmployees,
        todayAttendance,
        pendingLeaves,
      },
      charts: {
        deptDistribution,
        joiningTrend,
      },
      widgets: {
        recentEmployees,
        activities,
      }
    });
  } catch (err: any) {
    console.error('Dashboard stats retrieval error:', err);
    res.status(500).json({ error: 'Internal server error rendering dashboard.' });
  }
}
