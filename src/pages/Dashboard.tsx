import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { 
  Users, 
  Building2, 
  CalendarCheck, 
  FileCheck, 
  ArrowUpRight, 
  Plus, 
  Calendar, 
  UserPlus, 
  FileText,
  UserCheck,
  UserMinus,
  Briefcase,
  FileSpreadsheet,
  CheckSquare,
  Clock,
  Megaphone,
  User,
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [widgets, setWidgets] = useState<any>(null);

  // Employee-specific States
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);
  
  // Employee Apply Leave States
  const [leaveType, setLeaveType] = useState<'SICK' | 'CASUAL' | 'ANNUAL' | 'MATERNITY' | 'UNPAID'>('CASUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [applyingLeave, setApplyingLeave] = useState(false);

  // HR-specific States
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [upcomingHoliday, setUpcomingHoliday] = useState<any>(null);
  const [companyAttendance, setCompanyAttendance] = useState<any[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isFirstLoadRef = useRef(true);

  const getDaysRemainingText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return '';
    }
    if (diffDays === 0) {
      return 'today';
    }
    if (diffDays === 1) {
      return '1 day remaining';
    }
    return `${diffDays} days remaining`;
  };

  const formatHolidayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('en-GB', options); // e.g., '15 August 2026'
  };

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (d: Date = new Date()) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getLiveWorkingHours = (clockInStr: string | null) => {
    if (!clockInStr) return '00h 00m';
    try {
      const parts = clockInStr.split(':');
      if (parts.length < 2) return '00h 00m';
      const inH = parseInt(parts[0], 10);
      const inM = parseInt(parts[1], 10);
      const inS = parts[2] ? parseInt(parts[2], 10) : 0;

      const now = new Date();
      const inDate = new Date(now);
      inDate.setHours(inH, inM, inS, 0);

      let diffMs = now.getTime() - inDate.getTime();
      if (diffMs < 0) {
        diffMs = 0;
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    } catch (err) {
      console.error('Error calculating live working hours:', err);
      return '00h 00m';
    }
  };

  const formatClockTime = (timeStr: string | null) => {
    if (!timeStr) return undefined;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const formattedH = displayH < 10 ? `0${displayH}` : `${displayH}`;
    return `${formattedH}:${m} ${ampm}`;
  };

  const getDueDateText = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dueDateStr);
    d.setHours(0, 0, 0, 0);
    const diff = d.getTime() - today.getTime();
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    if (diffDays === -1) return 'Overdue Yesterday';
    if (diffDays < -1) return `Overdue by ${Math.abs(diffDays)} days`;
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `Due ${d.toLocaleDateString('en-GB', options)}`;
  };

  const getPriorityBadgeClass = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'HIGH') return 'bg-rose-950/40 text-rose-400 border border-rose-800/30';
    if (p === 'MEDIUM') return 'bg-amber-950/40 text-amber-400 border border-amber-800/30';
    return 'bg-blue-950/40 text-blue-400 border border-blue-800/30';
  };

  const loadDashboardData = async (isPoll = false) => {
    try {
      if (!isPoll) {
        setLoading(true);
      }
      setError(null);
      const role = user?.role;

      // Fetch upcoming holiday (available to everyone)
      try {
        const holData = await apiFetch('/api/holidays/upcoming');
        setUpcomingHoliday(holData.holiday || null);
      } catch (holErr) {
        console.error('Failed to load upcoming holiday:', holErr);
      }

      if (role === 'Admin' || role === 'HR') {
        const data = await apiFetch('/api/dashboard/stats');
        setStats(data.stats);
        setCharts(data.charts);
        setWidgets(data.widgets);

        // Fetch pending company leaves for approval
        try {
          const leaveData = await apiFetch('/api/leaves/company?status=PENDING');
          setPendingLeaves(leaveData.leaves || []);
        } catch (leaveErr) {
          console.error('Failed to load company leaves:', leaveErr);
        }

        // Fetch company attendance for metrics
        try {
          const attData = await apiFetch('/api/attendance/company');
          setCompanyAttendance(attData.records || []);
        } catch (attErr) {
          console.error('Failed to load company attendance:', attErr);
        }

        // Fetch all tasks for overview metrics
        try {
          const taskData = await apiFetch('/api/tasks');
          const newAllTasks = taskData.tasks || [];
          
          if (!isFirstLoadRef.current && allTasks.length > 0) {
            const completedMap = new Map(allTasks.map((t: any) => [t.id, t.status]));
            newAllTasks.forEach((t: any) => {
              const oldStatus = completedMap.get(t.id);
              if (t.status === 'COMPLETED' && oldStatus && oldStatus !== 'COMPLETED') {
                const empName = t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : 'An employee';
                showToast(`${empName} completed '${t.title}'.`, 'success');
              }
            });
          }
          setAllTasks(newAllTasks);
        } catch (taskErr) {
          console.error('Failed to load all tasks:', taskErr);
        }
      } else if (role === 'Employee') {
        // Fetch employee attendance status today
        const attData = await apiFetch('/api/attendance/me');
        const history = attData.history || [];
        setAttendanceHistory(history);
        
        const todayStr = getLocalDateString();
        const todayRec = history.find((r: any) => r.date === todayStr);
        if (todayRec) {
          setTodayRecord({
            ...todayRec,
            clock_in_time: formatClockTime(todayRec.clock_in),
            clock_out_time: formatClockTime(todayRec.clock_out),
          });
        } else {
          setTodayRecord(null);
        }

        // Fetch employee tasks
        const taskData = await apiFetch('/api/tasks/me');
        const tasks = taskData.tasks || [];
        
        if (!isFirstLoadRef.current) {
          const oldIds = new Set(myTasks.map((t: any) => t.id));
          const hasNewTask = tasks.some((t: any) => !oldIds.has(t.id));
          if (hasNewTask) {
            showToast('New task assigned.', 'success');
          }
        }
        setMyTasks(tasks);

        // Fetch employee leaves
        const leaveData = await apiFetch('/api/leaves/me');
        setMyLeaves(leaveData.leaves || []);
      }
      isFirstLoadRef.current = false;
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      if (!isPoll) {
        setError(err.message || 'Failed to compile workspace statistics. Please try again.');
      }
    } finally {
      if (!isPoll) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isFirstLoadRef.current = true;
    loadDashboardData();

    // Poll every 5 seconds to automatically keep the dashboard updated
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  // Quick action router
  const triggerQuickAction = (route: string) => {
    navigate(route);
  };

  // Clock In
  const handleClockIn = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const localDate = getLocalDateString(now);
      const localTime = getLocalTimeString(now);

      await apiFetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: localDate, clock_in: localTime })
      });
      showToast('Successfully clocked in for today.', 'success');
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Clock-in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const localDate = getLocalDateString(now);
      const localTime = getLocalTimeString(now);

      await apiFetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: localDate, clock_out: localTime })
      });
      showToast('Successfully clocked out for today.', 'success');
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Clock-out failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      setTogglingTaskId(taskId);
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast('Task status updated.', 'success');
      
      // Refresh tasks immediately
      await loadDashboardData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to update task.', 'error');
    } finally {
      setTogglingTaskId(null);
    }
  };

  // Toggle Task Status (legacy)
  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await handleUpdateTaskStatus(taskId, newStatus);
  };

  // Apply Leave (ESS Dashboard Form)
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      showToast('Please fill out all leave request fields.', 'error');
      return;
    }

    const start = new Date(leaveStart);
    const end = new Date(leaveEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      showToast('Invalid date format.', 'error');
      return;
    }

    if (start > end) {
      showToast('Start date cannot be after end date.', 'error');
      return;
    }

    try {
      setApplyingLeave(true);
      await apiFetch('/api/leaves/apply', {
        method: 'POST',
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: leaveStart,
          end_date: leaveEnd,
          reason: leaveReason
        }),
      });

      showToast('Your leave request has been submitted.', 'success');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      
      // Refresh leaves list
      const leaveData = await apiFetch('/api/leaves/me');
      setMyLeaves(leaveData.leaves || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit leave.', 'error');
    } finally {
      setApplyingLeave(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800/30 flex items-center justify-center">
            <span className="text-rose-500 font-bold text-xl">!</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Workspace Statistics Error</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader message="Compiling workspace stats..." />;
  }

  // Feature 6: HR/Admin Dashboard stats calculations
  const todayStr = getLocalDateString();
  const employeesPresentToday = companyAttendance.filter(
    (r: any) => r.date === todayStr && ['PRESENT', 'LATE', 'COMPLETED'].includes(r.status)
  ).length;

  const employeesAbsentToday = Math.max(0, (stats?.activeEmployees || stats?.totalEmployees || 0) - employeesPresentToday);

  const lateArrivalsToday = companyAttendance.filter((r: any) => {
    if (r.date !== todayStr) return false;
    if (r.status === 'LATE') return true;
    if (r.clock_in) {
      const [h, m] = r.clock_in.split(':').map(Number);
      return h > 9 || (h === 9 && m > 15);
    }
    return false;
  }).length;

  const averageWorkingHoursToday = (() => {
    const completedRecords = companyAttendance.filter((r: any) => r.date === todayStr && r.working_hours && r.working_hours !== '00h 00m');
    if (completedRecords.length === 0) return '0.0 hrs';
    let totalMinutes = 0;
    completedRecords.forEach((r: any) => {
      const match = r.working_hours.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        totalMinutes += h * 60 + m;
      }
    });
    const avgMinutes = totalMinutes / completedRecords.length;
    const avgHours = avgMinutes / 60;
    return `${avgHours.toFixed(1)} hrs`;
  })();

  const role = user?.role || 'Employee';

  const totalTasksCount = allTasks.length;
  const pendingTasksCount = allTasks.filter((t: any) => t.status === 'PENDING').length;
  const inProgressTasksCount = allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const completedTasksCount = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
  const overdueTasksCount = allTasks.filter((t: any) => t.status !== 'COMPLETED' && t.due_date < todayStr).length;

  // Chart configuration (for Admin / HR charts)
  const deptLabels = charts?.deptDistribution?.map((d: any) => d.department) || [];
  const deptCounts = charts?.deptDistribution?.map((d: any) => d.count) || [];
  const barData = {
    labels: deptLabels.length > 0 ? deptLabels : ['Operations', 'Engineering', 'HR', 'Finance'],
    datasets: [
      {
        label: 'Active Employees',
        data: deptCounts.length > 0 ? deptCounts : [0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const trendLabels = charts?.joiningTrend?.map((t: any) => t.month) || [];
  const trendCounts = charts?.joiningTrend?.map((t: any) => t.count) || [];
  const lineData = {
    labels: trendLabels.length > 0 ? trendLabels : ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'New Hires',
        data: trendCounts.length > 0 ? trendCounts : [0, 0, 0, 0],
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 10 } } },
      y: { grid: { color: 'rgba(63, 63, 70, 0.2)' }, ticks: { color: '#a1a1aa', font: { size: 10 }, stepSize: 1 } },
    },
  };

  // Render individual dashboards based on roles
  if (role === 'Admin') {
    return (
      <div className="space-y-8" id="admin-dashboard">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
            Enterprise Command Console
          </h1>
          <p className="text-zinc-400 text-sm">
            Operational telemetry and management matrix for {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>

        {/* Admin KPI stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Employees Present Today */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Present Today</span>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{employeesPresentToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Active checked-in staff</p>
            </div>
            <div className="h-12 w-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-2xl">
              <CalendarCheck className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Employees Absent Today */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Absent Today</span>
              <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{employeesAbsentToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Expected staff out of office</p>
            </div>
            <div className="h-12 w-12 bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Late Arrivals */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Late Arrivals</span>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{lateArrivalsToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Arrived after grace period</p>
            </div>
            <div className="h-12 w-12 bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Average Working Hours */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Avg Work Hours</span>
              <h3 className="text-3xl font-extrabold text-blue-400 mt-1">{averageWorkingHoursToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Per completed shift today</p>
            </div>
            <div className="h-12 w-12 bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center rounded-2xl">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Charts block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col h-80">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-white tracking-tight">Active Employee Allocation</h4>
              <span className="text-[10px] text-slate-500 font-mono">SQLite Aggregated</span>
            </div>
            <div className="flex-1 relative">
              {deptLabels.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-650 text-xs font-mono">
                  No active department records mapped.
                </div>
              ) : (
                <Bar data={barData} options={chartOptions} />
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col h-80">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-white tracking-tight">Monthly Onboarding Velocity</h4>
              <span className="text-[10px] text-slate-500 font-mono">All-time trend</span>
            </div>
            <div className="flex-1 relative">
              {trendLabels.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-650 text-xs font-mono">
                  No hiring velocity data found.
                </div>
              ) : (
                <Line data={lineData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Primary admin layout rows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-semibold text-white tracking-tight">Recently Added Employees</h4>
              <button
                onClick={() => triggerQuickAction('/employees')}
                className="text-xs text-blue-400 hover:text-blue-350 flex items-center gap-1 font-semibold transition-colors"
              >
                <span>Manage Base</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              {widgets?.recentEmployees && widgets.recentEmployees.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                      <th className="pb-3">Employee</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Position</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {widgets.recentEmployees.map((emp: any) => (
                      <tr key={emp.id} className="text-slate-300 hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 font-medium text-white flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-slate-900 rounded border border-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">
                            {emp.first_name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span>{emp.first_name} {emp.last_name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.employee_id}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-400 text-xs">{emp.department_name || <span className="text-slate-600 italic">Unassigned</span>}</td>
                        <td className="py-3 text-slate-400 text-xs">{emp.position}</td>
                        <td className="py-3">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            emp.status === 'ACTIVE' 
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  No employee directory profiles saved yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
              <h4 className="text-sm font-semibold text-white tracking-tight mb-4">Quick Operations</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => triggerQuickAction('/employees')}
                  className="p-4 bg-slate-950 hover:bg-slate-800/40 border border-slate-800/50 hover:border-blue-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <UserPlus className="h-5 w-5 text-blue-400" />
                  <span className="text-xs font-semibold">Add Employee</span>
                </button>
                <button
                  onClick={() => triggerQuickAction('/departments')}
                  className="p-4 bg-slate-950 hover:bg-slate-800/40 border border-slate-800/50 hover:border-amber-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <Building2 className="h-5 w-5 text-amber-400" />
                  <span className="text-xs font-semibold">Add Dept</span>
                </button>
                <button
                  onClick={() => triggerQuickAction('/reports')}
                  className="p-4 bg-slate-950 hover:bg-slate-800/40 border border-slate-800/50 hover:border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-semibold">Reports Sheet</span>
                </button>
                <button
                  onClick={() => triggerQuickAction('/settings')}
                  className="p-4 bg-slate-950 hover:bg-slate-800/40 border border-slate-800/50 hover:border-rose-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-rose-400" />
                  <span className="text-xs font-semibold">Suite Config</span>
                </button>
              </div>
            </div>

            {/* Platform log events list */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
              <h4 className="text-sm font-semibold text-white tracking-tight mb-4">Platform Action Logs</h4>
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {widgets?.activities && widgets.activities.length > 0 ? (
                  widgets.activities.map((act: any, i: number) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="mt-0.5 p-1 bg-slate-950 rounded shrink-0 border border-slate-800 text-blue-400">
                        <Clock className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-normal font-sans">{act.description}</p>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 font-mono text-[11px]">
                    No action log events tracked yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HR Dashboard
  if (role === 'HR') {
    return (
      <div className="space-y-8" id="hr-dashboard">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
            HR Operations Hub
          </h1>
          <p className="text-zinc-400 text-sm">
            Workforce directories, attendance logs, and leave reviews console.
          </p>
        </div>

        {/* HR KPI Stats - Completely Separate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Employees Present Today */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Present Today</span>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{employeesPresentToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Active checked-in staff</p>
            </div>
            <div className="h-12 w-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-2xl">
              <CalendarCheck className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Employees Absent Today */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Absent Today</span>
              <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{employeesAbsentToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Expected staff out of office</p>
            </div>
            <div className="h-12 w-12 bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Late Arrivals */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Late Arrivals</span>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{lateArrivalsToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Arrived after grace period</p>
            </div>
            <div className="h-12 w-12 bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Average Working Hours */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Avg Work Hours</span>
              <h3 className="text-3xl font-extrabold text-blue-400 mt-1">{averageWorkingHoursToday}</h3>
              <p className="text-xs text-slate-500 mt-2">Per completed shift today</p>
            </div>
            <div className="h-12 w-12 bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center rounded-2xl">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* HR Tasks Overview Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {/* Total Tasks */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
            <div className="text-left">
              <span className="text-xs font-mono font-semibold tracking-wider text-blue-500 uppercase">Total Tasks</span>
              <h3 className="text-2xl font-extrabold text-blue-400 mt-1">{totalTasksCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total active entries</p>
            </div>
            <div className="h-10 w-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
            <div className="text-left">
              <span className="text-xs font-mono font-semibold tracking-wider text-amber-500 uppercase">Pending Tasks</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{pendingTasksCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Awaiting action</p>
            </div>
            <div className="h-10 w-10 bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {/* In Progress Tasks */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
            <div className="text-left">
              <span className="text-xs font-mono font-semibold tracking-wider text-sky-500 uppercase">In Progress</span>
              <h3 className="text-2xl font-extrabold text-sky-450 mt-1">{inProgressTasksCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Actively working</p>
            </div>
            <div className="h-10 w-10 bg-sky-600/10 border border-sky-500/20 text-sky-450 flex items-center justify-center rounded-xl">
              <Play className="h-5 w-5" />
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
            <div className="text-left">
              <span className="text-xs font-mono font-semibold tracking-wider text-emerald-500 uppercase">Completed Tasks</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{completedTasksCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Successfully closed</p>
            </div>
            <div className="h-10 w-10 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
            <div className="text-left">
              <span className="text-xs font-mono font-semibold tracking-wider text-rose-500 uppercase">Overdue Tasks</span>
              <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{overdueTasksCount}</h3>
              <p className="text-[10px] text-rose-500 mt-1 font-medium">Passed deadline</p>
            </div>
            <div className="h-10 w-10 bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center rounded-xl">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* HR Grid (Main Content) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Joiners & Department Breakdown */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl lg:col-span-2 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-white tracking-tight mb-4">Workforce Officer Directory Summary</h4>
              <div className="overflow-x-auto">
                {widgets?.recentEmployees && widgets.recentEmployees.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                        <th className="pb-3">Employee</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3">Job Title</th>
                        <th className="pb-3">Joining Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {widgets.recentEmployees.slice(0, 5).map((emp: any) => (
                        <tr key={emp.id} className="text-slate-300 hover:bg-slate-800/10 transition-colors">
                          <td className="py-2.5 font-medium text-white flex items-center gap-2">
                            <div className="h-7 w-7 bg-blue-950 border border-blue-500/20 text-blue-400 rounded flex items-center justify-center text-[10px] font-bold select-none">
                              {emp.first_name[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{emp.first_name} {emp.last_name}</span>
                              <span className="text-[9px] font-mono text-slate-500">{emp.employee_id}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-slate-400 text-xs">{emp.department_name || <span className="text-slate-650 italic">None</span>}</td>
                          <td className="py-2.5 text-slate-400 text-xs">{emp.position}</td>
                          <td className="py-2.5 text-slate-400 text-xs font-mono">{emp.joining_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-slate-500 font-mono text-xs">
                    No workforce profiles logged yet.
                  </div>
                )}
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-sm font-semibold text-white tracking-tight mb-4">Active Business Segments (Staff Allocation)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {charts?.deptDistribution && charts.deptDistribution.length > 0 ? (
                  charts.deptDistribution.map((dept: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                      <span className="text-[10px] uppercase text-slate-500 font-mono block mb-1 truncate">{dept.department}</span>
                      <span className="text-xl font-bold text-white">{dept.count} <span className="text-xs text-slate-400 font-normal">Allocated</span></span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center text-slate-500 font-mono text-xs py-4">
                    No department metrics parsed yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HR Tasks Sidebar */}
          <div className="space-y-6">
            {/* HR Actions */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
              <h4 className="text-sm font-semibold text-white tracking-tight mb-4">Operations Console</h4>
              <div className="space-y-2">
                <button
                  onClick={() => triggerQuickAction('/employees')}
                  className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4.5 w-4.5 text-blue-400" />
                    <span className="text-xs font-semibold text-slate-200">Register New Hires</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => triggerQuickAction('/attendance')}
                  className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck className="h-4.5 w-4.5 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">Track Attendance Logs</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => triggerQuickAction('/leaves')}
                  className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-4.5 w-4.5 text-rose-400" />
                    <span className="text-xs font-semibold text-slate-200">Approve Leave Requests</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Pending Leaves List */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold text-white tracking-tight">Pending HR Decisions</h4>
                <button
                  onClick={() => triggerQuickAction('/leaves')}
                  className="text-[10px] text-blue-400 font-semibold hover:underline"
                >
                  View All ({pendingLeaves.length})
                </button>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {pendingLeaves.length > 0 ? (
                  pendingLeaves.slice(0, 4).map((leave: any) => (
                    <div key={leave.id} className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-white">{leave.first_name} {leave.last_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-950/40 text-amber-400 border border-amber-800/20 uppercase">
                          {leave.leave_type}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] truncate">{leave.reason}</p>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-900">
                        <span>{leave.start_date} to {leave.end_date}</span>
                        <span className="text-blue-400 font-semibold">{leave.duration_days} Days</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs">
                    Clear docket! No pending leaves to review.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Employee Dashboard (ESS Hub)
  const emp = user?.employee;

  // Employee Attendance statistics
  const employeePresentDays = attendanceHistory.filter(
    (r: any) => ['PRESENT', 'LATE', 'COMPLETED'].includes(r.status)
  ).length;

  const employeeAbsentDays = attendanceHistory.filter(
    (r: any) => r.status === 'ABSENT'
  ).length;

  const employeeAttendancePct = (() => {
    const total = attendanceHistory.length;
    return total > 0 ? ((employeePresentDays / total) * 100).toFixed(1) : '100.0';
  })();

  const employeeCurrentMonthWorkingHours = (() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalMins = 0;
    attendanceHistory.forEach((r: any) => {
      if (!r.date) return;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const hoursMatch = (r.working_hours || r.workingHours || '').match(/(\d+)h/);
        const minsMatch = (r.working_hours || r.workingHours || '').match(/(\d+)m/);
        const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
        totalMins += h * 60 + m;
      }
    });

    if (todayRecord && !todayRecord.clock_out) {
      const liveHoursStr = getLiveWorkingHours(todayRecord.clock_in);
      const hoursMatch = liveHoursStr.match(/(\d+)h/);
      const minsMatch = liveHoursStr.match(/(\d+)m/);
      const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
      const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
      totalMins += h * 60 + m;
    }

    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  })();
  return (
    <div className="space-y-6" id="employee-dashboard">
      {/* Welcome Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
            Welcome, {emp ? emp.first_name : user?.email.split('@')[0]}!
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Operational dashboard and Employee Self-Service console.
          </p>
        </div>

        {/* Real-time Presence Clock In/Out Actions (FEATURE 1, 2, 3) */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl shrink-0 flex flex-col sm:flex-row items-center gap-6 shadow-xl w-full md:w-auto">
          <div className="text-left space-y-1 md:border-r md:border-slate-800/80 md:pr-6 w-full sm:w-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">Today's Attendance</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${!todayRecord ? 'bg-slate-500' : !todayRecord.clock_out ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              <span className="text-sm font-bold text-white uppercase tracking-tight">
                {!todayRecord ? 'Not Checked In' : todayRecord.status}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              State: {!todayRecord ? 'Not Started' : !todayRecord.clock_out ? 'Active Session' : 'Shift Completed'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-x-6 gap-y-1 font-mono text-xs w-full sm:w-auto">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Clock In</span>
              <span className="font-bold text-slate-300">
                {todayRecord ? (formatClockTime(todayRecord.clock_in) || '--') : '--'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Clock Out</span>
              <span className="font-bold text-slate-300">
                {todayRecord ? (formatClockTime(todayRecord.clock_out) || '--') : '--'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Work Hours</span>
              <span className="font-bold text-blue-400">
                {todayRecord ? (
                  !todayRecord.clock_out ? getLiveWorkingHours(todayRecord.clock_in) : (todayRecord.working_hours || todayRecord.workingHours || '00h 00m')
                ) : '00h 00m'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            {!todayRecord ? (
              <button
                onClick={handleClockIn}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Clock className="h-4 w-4" />
                <span>Clock In</span>
              </button>
            ) : !todayRecord.clock_out ? (
              <button
                onClick={handleClockOut}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Clock className="h-4 w-4" />
                <span>Clock Out</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold rounded-xl select-none flex items-center justify-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Shift Complete</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee KPI stats/cards (FEATURE 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Present Days Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Present Days</span>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{employeePresentDays} Days</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              On-time shifts recorded
            </p>
          </div>
          <div className="h-10 w-10 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Absent Days Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Absent Days</span>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{employeeAbsentDays} Days</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Missed active shifts
            </p>
          </div>
          <div className="h-10 w-10 bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center rounded-xl">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Attendance Percentage Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Attendance rate</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{employeeAttendancePct}%</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Ratio of presence
            </p>
          </div>
          <div className="h-10 w-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center rounded-xl">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Current Month Working Hours Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">Month Work Hours</span>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{employeeCurrentMonthWorkingHours}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Total hours recorded this month
            </p>
          </div>
          <div className="h-10 w-10 bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle Column: Interactive Tasks & Leaves */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Announcements */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-blue-400" />
              <span>Announcements Bulletin</span>
            </h3>
            <div className="space-y-4 text-left">
              <div className="p-4 bg-slate-950 border-l-4 border-blue-500 rounded-r-2xl rounded-l-md space-y-1 shadow-sm">
                <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">Enterprise Notice</span>
                <h4 className="text-xs font-bold text-white">NexaHR Operational Launch Completed</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Phase 2 Role-Based Access control and Employee Self-Service portal is now online. Complete your security profiles and change temporary password keys.</p>
              </div>
              <div className="p-4 bg-slate-950 border-l-4 border-emerald-500 rounded-r-2xl rounded-l-md space-y-1 shadow-sm">
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Corporate Wellness</span>
                <h4 className="text-xs font-bold text-white">Holiday Schedule Adjustments</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">The holiday calendar adjustments have been approved. Submit any leave applications in advance to coordinate team schedules.</p>
              </div>
            </div>
          </div>

          {/* Tasks & Directives Checklist */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CheckSquare className="h-4.5 w-4.5 text-blue-400" />
              <span>Assigned Active Directives</span>
            </h3>

            <div className="space-y-2.5">
              {myTasks.length > 0 ? (
                myTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-all hover:bg-slate-950"
                  >
                    <div className="flex-1 min-w-0 text-left space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority || 'Medium'} Priority
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.status === 'COMPLETED' 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' 
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-sky-950/40 text-sky-400 border border-sky-800/30'
                            : 'bg-zinc-850 text-zinc-400 border border-zinc-700/30'
                        }`}>
                          {task.status === 'COMPLETED' ? 'Completed' : task.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      
                      <p className={`text-sm font-bold tracking-tight ${task.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      
                      {task.description && (
                        <p className="text-slate-450 text-[11px] leading-relaxed">{task.description}</p>
                      )}
                      
                      <p className="text-[10px] text-slate-500 font-mono font-medium">
                        {getDueDateText(task.due_date)}
                      </p>
                    </div>

                    {task.status === 'PENDING' && (
                      <button
                        disabled={togglingTaskId === task.id}
                        onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                        className="sm:self-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer text-center whitespace-nowrap"
                      >
                        {togglingTaskId === task.id ? 'Updating...' : 'Start Task'}
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button
                        disabled={togglingTaskId === task.id}
                        onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                        className="sm:self-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer text-center whitespace-nowrap"
                      >
                        {togglingTaskId === task.id ? 'Updating...' : 'Mark Completed'}
                      </button>
                    )}
                    {task.status === 'COMPLETED' && (
                      <button
                        disabled={togglingTaskId === task.id}
                        onClick={() => handleUpdateTaskStatus(task.id, 'PENDING')}
                        className="sm:self-center px-3 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-[11px] font-semibold rounded-xl transition-all cursor-pointer text-center whitespace-nowrap"
                      >
                        {togglingTaskId === task.id ? 'Updating...' : 'Re-open Task'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 space-y-1">
                  <p className="text-sm font-semibold">No assigned tasks. You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Profile details & Leave application form */}
        <div className="space-y-6">
          {/* Personal Profile Block */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl text-left space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
              <User className="h-4.5 w-4.5 text-blue-400" />
              <span>Workspace Profile Details</span>
            </h3>

            <div className="space-y-3 text-xs leading-normal">
              <div>
                <span className="text-[9px] uppercase text-slate-500 font-mono block">Registered Employee ID</span>
                <p className="font-mono text-blue-400 font-semibold mt-0.5">{emp?.employee_id || 'Not Assigned'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] uppercase text-slate-500 font-mono block">Department</span>
                  <p className="font-semibold text-white mt-0.5">{emp?.department_name || 'General Operation'}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-500 font-mono block">Position Title</span>
                  <p className="font-semibold text-white mt-0.5">{emp?.position || 'Associate'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] uppercase text-slate-500 font-mono block">Joining Date</span>
                  <p className="font-semibold text-white mt-0.5 font-mono">{emp?.joining_date || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-500 font-mono block">Active Status</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">{emp?.status || 'ACTIVE'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-850">
                <span className="text-[9px] uppercase text-slate-500 font-mono block">Work Email Connection</span>
                <p className="font-semibold text-slate-300 mt-0.5 truncate">{emp?.email || user?.email}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-500 font-mono block">Work Contact Phone</span>
                <p className="font-semibold text-slate-300 mt-0.5">{emp?.phone || 'Not Entered'}</p>
              </div>
            </div>
          </div>

          {/* Inline Leave Request Form */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl text-left relative overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
              <FileCheck className="h-4.5 w-4.5 text-emerald-400" />
              <span>Apply for Leave Request</span>
            </h3>

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs text-left">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="MATERNITY">Maternity/Paternity</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Detailed Reason</label>
                <textarea
                  required
                  placeholder="Explain briefly..."
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={applyingLeave}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {applyingLeave ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Leave Request</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Compact Leaves History */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl text-left">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
              <Calendar className="h-4.5 w-4.5 text-blue-400" />
              <span>My Leaves History</span>
            </h3>

            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              {myLeaves.length > 0 ? (
                myLeaves.slice(0, 4).map((leave) => (
                  <div key={leave.id} className="p-3 bg-slate-950/70 border border-slate-850 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-300">{leave.leave_type} Leave</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        leave.status === 'APPROVED' 
                          ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-800/30' 
                          : leave.status === 'REJECTED'
                          ? 'bg-rose-950/45 text-rose-400 border border-rose-800/30'
                          : 'bg-amber-950/45 text-amber-400 border border-amber-800/30'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] truncate">{leave.reason}</p>
                    <div className="text-[9px] text-slate-500 font-mono pt-1">
                      {leave.start_date} to {leave.end_date} • {leave.duration_days} Days
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 font-mono text-[10px]">
                  No leaf requests filed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
