export type UserRole = 'Admin' | 'HR' | 'Employee';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  employee?: Employee | null;
}

export interface Employee {
  id: number;
  employee_id: string;
  user_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: number | null;
  department_name?: string;
  position: string;
  salary: number;
  joining_date: string;
  status: 'ACTIVE' | 'INACTIVE';
  user_role?: UserRole;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  employee_count?: number;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  first_name?: string;
  last_name?: string;
  emp_str_id?: string;
  department_name?: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  first_name?: string;
  last_name?: string;
  emp_str_id?: string;
  department_name?: string;
  leave_type: 'SICK' | 'CASUAL' | 'ANNUAL' | 'MATERNITY' | 'UNPAID';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by: number | null;
  approved_by_email?: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  employee_id: number;
  assigned_by?: string;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High';
  due_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  first_name?: string;
  last_name?: string;
  emp_id?: string;
  assignedDate?: string;
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  activeEmployees: number;
  inactiveEmployees: number;
  todayAttendance: number;
  pendingLeaves: number;
}

export interface DashboardCharts {
  deptDistribution: { department: string; count: number }[];
  joiningTrend: { month: string; count: number }[];
}

export interface DashboardWidgets {
  recentEmployees: (Employee & { department_name?: string })[];
  activities: {
    type: 'HIRE' | 'ATTENDANCE' | 'LEAVE';
    description: string;
    timestamp: string;
  }[];
}
