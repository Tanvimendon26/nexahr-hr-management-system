import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { login, logout, getCurrentUser } from '../controllers/authController';
import { 
  createEmployee, 
  getEmployees, 
  getEmployeeById, 
  updateEmployee, 
  deleteEmployee 
} from '../controllers/employeeController';
import { 
  createDepartment, 
  getDepartments, 
  updateDepartment, 
  deleteDepartment 
} from '../controllers/departmentController';
import { 
  clockIn, 
  clockOut, 
  getMyAttendance, 
  getCompanyAttendance, 
  updateAttendanceStatus,
  deleteAttendance
} from '../controllers/attendanceController';
import { 
  applyLeave, 
  getMyLeaves, 
  getCompanyLeaves, 
  processLeave 
} from '../controllers/leaveController';
import { 
  getMyTasks, 
  getEmployeeTasks, 
  getTasks,
  createTask, 
  updateTask,
  updateTaskStatus, 
  deleteTask 
} from '../controllers/taskController';
import { getUpcomingHoliday } from '../controllers/holidayController';
import { 
  getEmployeeReport, 
  getAttendanceReport, 
  getLeaveReport, 
  getPdfReportPlaceholder 
} from '../controllers/reportController';
import { 
  getSettings, 
  updateSettings, 
  changePassword 
} from '../controllers/settingsController';

const router = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', login);
router.post('/auth/logout', requireAuth, logout);
router.get('/auth/me', requireAuth, getCurrentUser);

// ==========================================
// 2. DASHBOARD ROUTES
// ==========================================
import { getDashboardStats } from '../controllers/dashboardController';
router.get('/dashboard/stats', requireAuth, getDashboardStats);

// ==========================================
// 3. EMPLOYEE MANAGEMENT ROUTES
// ==========================================
router.post('/employees', requireAuth, requireRole(['Admin', 'HR']), createEmployee);
router.get('/employees', requireAuth, requireRole(['Admin', 'HR']), getEmployees);

// Guarded employee profile view
router.get('/employees/:id', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  const targetId = parseInt(req.params.id);
  if (req.user?.role === 'Employee' && req.user.employeeId !== targetId) {
    res.status(403).json({ error: 'Forbidden: You cannot view other employees\' profiles.' });
    return;
  }
  next();
}, getEmployeeById);

router.put('/employees/:id', requireAuth, requireRole(['Admin', 'HR']), updateEmployee);
router.delete('/employees/:id', requireAuth, requireRole(['Admin']), deleteEmployee);

// ==========================================
// 4. DEPARTMENT ROUTES
// ==========================================
router.post('/departments', requireAuth, requireRole(['Admin']), createDepartment);
router.get('/departments', requireAuth, getDepartments); // Accessible to all authenticated users for dropdowns
router.put('/departments/:id', requireAuth, requireRole(['Admin']), updateDepartment);
router.delete('/departments/:id', requireAuth, requireRole(['Admin']), deleteDepartment);

// ==========================================
// 5. ATTENDANCE ROUTES
// ==========================================
router.post('/attendance/clock-in', requireAuth, clockIn);
router.post('/attendance/clock-out', requireAuth, clockOut);
router.get('/attendance/me', requireAuth, getMyAttendance);
router.get('/attendance/company', requireAuth, requireRole(['Admin', 'HR']), getCompanyAttendance);
router.put('/attendance/:id', requireAuth, requireRole(['Admin', 'HR']), updateAttendanceStatus);
router.delete('/attendance/:id', requireAuth, requireRole(['Admin', 'HR']), deleteAttendance);

// ==========================================
// 6. LEAVE MANAGEMENT ROUTES
// ==========================================
router.post('/leaves/apply', requireAuth, applyLeave);
router.get('/leaves/me', requireAuth, getMyLeaves);
router.get('/leaves/company', requireAuth, requireRole(['Admin', 'HR']), getCompanyLeaves);
router.put('/leaves/:id', requireAuth, requireRole(['Admin', 'HR']), processLeave);

// ==========================================
// 7. TASK MANAGEMENT ROUTES
// ==========================================
router.get('/tasks/me', requireAuth, getMyTasks);
router.get('/tasks', requireAuth, requireRole(['Admin', 'HR']), getTasks);
router.get('/tasks/employee/:employeeId', requireAuth, requireRole(['Admin', 'HR']), getEmployeeTasks);
router.post('/tasks', requireAuth, requireRole(['Admin', 'HR']), createTask);
router.put('/tasks/:id', requireAuth, updateTaskStatus); // Employees can complete their own tasks
router.put('/tasks/edit/:id', requireAuth, requireRole(['Admin', 'HR']), updateTask); // HR/Admin can edit details
router.delete('/tasks/:id', requireAuth, requireRole(['Admin', 'HR']), deleteTask);

// ==========================================
// 7.5 HOLIDAYS ROUTES
// ==========================================
router.get('/holidays/upcoming', requireAuth, getUpcomingHoliday);

// ==========================================
// 8. REPORTS ROUTES
// ==========================================
router.get('/reports/employees', requireAuth, requireRole(['Admin', 'HR']), getEmployeeReport);
router.get('/reports/attendance', requireAuth, requireRole(['Admin', 'HR']), getAttendanceReport);
router.get('/reports/leaves', requireAuth, requireRole(['Admin', 'HR']), getLeaveReport);
router.get('/reports/pdf', requireAuth, requireRole(['Admin', 'HR']), getPdfReportPlaceholder);

// ==========================================
// 9. SETTINGS ROUTES
// ==========================================
router.get('/settings', requireAuth, getSettings);
router.put('/settings', requireAuth, requireRole(['Admin']), updateSettings);
router.put('/settings/change-password', requireAuth, changePassword);

export default router;
