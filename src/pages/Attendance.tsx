import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { AttendanceRecord } from '../types';
import { 
  Calendar, 
  Clock, 
  Search, 
  Edit3, 
  Trash2,
  X, 
  CheckCircle, 
  Play,
  Square,
  Building,
  Filter
} from 'lucide-react';

export default function Attendance() {
  const { user, apiFetch, showToast } = useAuth();
  const isEmployee = user?.role === 'Employee';

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [companyRecords, setCompanyRecords] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Clock status for Employee
  const [todayRecord, setTodayRecord] = useState<any | null>(null);

  // Filters for Admin / HR
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Adjustments
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [adjustStatus, setAdjustStatus] = useState('PRESENT');
  const [adjustClockIn, setAdjustClockIn] = useState('');
  const [adjustClockOut, setAdjustClockOut] = useState('');
  const [adjustDate, setAdjustDate] = useState('');

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

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

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

  // Format helper to display AM/PM times
  const formatClockTime = (timeStr: string | null) => {
    if (!timeStr) return '--';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const formattedH = displayH < 10 ? `0${displayH}` : `${displayH}`;
    return `${formattedH}:${m} ${ampm}`;
  };

  // Fetch departments for filtering
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await apiFetch('/api/departments');
        setDepartments(data.departments || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    if (!isEmployee) {
      fetchDepts();
    }
  }, [isEmployee]);

  // Load appropriate records
  const loadAttendance = async () => {
    try {
      setLoading(true);
      if (isEmployee) {
        // Fetch own history
        const data = await apiFetch('/api/attendance/me');
        const list = data.history || [];
        setHistory(list);

        // Find today's record in history
        const todayStr = getLocalDateString();
        const today = list.find((r: any) => r.date === todayStr);
        setTodayRecord(today || null);
      } else {
        // Fetch company history
        let url = `/api/attendance/company?status=${filterStatus}&search=${encodeURIComponent(searchQuery)}`;
        if (filterDate) {
          url += `&date=${filterDate}`;
        }
        if (filterDepartment) {
          url += `&department_id=${filterDepartment}`;
        }
        const data = await apiFetch(url);
        setCompanyRecords(data.records || []);
      }
    } catch (err) {
      console.error('Error loading attendance logs:', err);
      showToast('Could not load attendance details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [filterDate, filterStatus, filterDepartment, searchQuery]);

  // Clock In
  const handleClockIn = async () => {
    try {
      const now = new Date();
      const localDate = getLocalDateString(now);
      const localTime = getLocalTimeString(now);

      const data = await apiFetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: localDate, clock_in: localTime })
      });
      showToast(`Clocked in successfully at ${formatClockTime(data.clockIn || data.clock_in)}.`, 'success');
      loadAttendance();
    } catch (err: any) {
      console.error('Clock in failed:', err);
      showToast(err.message || 'Clock in failed.', 'error');
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    try {
      const now = new Date();
      const localDate = getLocalDateString(now);
      const localTime = getLocalTimeString(now);

      const data = await apiFetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: localDate, clock_out: localTime })
      });
      showToast(`Clocked out successfully. Working hours: ${data.workingHours || data.working_hours}.`, 'success');
      loadAttendance();
    } catch (err: any) {
      console.error('Clock out failed:', err);
      showToast(err.message || 'Clock out failed.', 'error');
    }
  };

  // Delete Attendance Record
  const handleDeleteAttendance = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await apiFetch(`/api/attendance/${id}`, { method: 'DELETE' });
      showToast('Attendance record deleted successfully.', 'success');
      loadAttendance();
    } catch (err: any) {
      console.error('Delete attendance error:', err);
      showToast(err.message || 'Failed to delete attendance record.', 'error');
    }
  };

  // Edit status override submit
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      await apiFetch(`/api/attendance/${selectedRecord.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: adjustStatus,
          clock_in: adjustClockIn,
          clock_out: adjustClockOut,
          date: adjustDate
        }),
      });

      showToast('Attendance record updated successfully.', 'success');
      setIsEditOpen(false);
      setSelectedRecord(null);
      loadAttendance();
    } catch (err: any) {
      console.error('Update status error:', err);
      showToast(err.message || 'Failed to override attendance.', 'error');
    }
  };

  const handleOpenEdit = (rec: any) => {
    setSelectedRecord(rec);
    setAdjustStatus(rec.status);
    setAdjustClockIn(rec.clock_in || '');
    setAdjustClockOut(rec.clock_out || '');
    setAdjustDate(rec.date || '');
    setIsEditOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PRESENT') {
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30';
    }
    if (s === 'COMPLETED') {
      return 'bg-blue-950/40 text-blue-400 border border-blue-800/30';
    }
    if (s === 'LATE') {
      return 'bg-amber-950/40 text-amber-400 border border-amber-800/30';
    }
    if (s === 'HALF_DAY' || s === 'HALF-DAY') {
      return 'bg-sky-950/40 text-sky-400 border border-sky-800/30';
    }
    return 'bg-rose-950/40 text-rose-400 border border-rose-800/30';
  };

  return (
    <div className="space-y-6" id="attendance-registry">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Presence & Attendance Registry
          </h1>
          <p className="text-zinc-400 text-sm">
            {isEmployee 
              ? 'Record daily hours, track punctual status, and consult historical entry slips.' 
              : 'Review corporate timesheets, enforce check-in policies, and log manual overrides.'}
          </p>
        </div>

        {isEmployee && (
          <span className={`px-3 py-1 text-[11px] font-mono font-bold uppercase rounded-full self-start md:self-center ${
            !todayRecord 
              ? 'bg-slate-950 text-slate-500 border border-slate-850' 
              : !todayRecord.clock_out 
              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 animate-pulse' 
              : 'bg-blue-950/50 text-blue-400 border border-blue-800/30'
          }`}>
            {!todayRecord ? 'Not Clocked In' : !todayRecord.clock_out ? 'Session Active' : 'Shift Completed'}
          </span>
        )}
      </div>

      {isEmployee ? (
        // EMPLOYEE VIEW
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Console card */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden h-fit space-y-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg text-blue-400">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Check-In Console</h3>
              </div>

              <div className="text-center py-6 bg-slate-950 border border-slate-800/60 rounded-2xl my-4">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">Current Date</span>
                <span className="text-sm font-bold text-white block">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                
                {todayRecord ? (
                  <div className="mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-400 space-y-2.5 px-4 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Status:</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${getStatusBadge(todayRecord.status)}`}>
                        {todayRecord.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Clock In:</span>
                      <strong className="text-slate-200 font-mono">{formatClockTime(todayRecord.clock_in)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Clock Out:</span>
                      <strong className="text-slate-200 font-mono">
                        {todayRecord.clock_out ? formatClockTime(todayRecord.clock_out) : <span className="text-amber-500/80 italic">In Progress</span>}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Working Hours:</span>
                      <strong className="text-blue-400 font-mono">
                        {!todayRecord.clock_out ? getLiveWorkingHours(todayRecord.clock_in) : (todayRecord.working_hours || todayRecord.workingHours || '00h 00m')}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-3 px-3">You have not clocked in yet today.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={todayRecord !== null}
                onClick={handleClockIn}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-950 disabled:text-slate-600 disabled:border disabled:border-slate-850 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="h-4 w-4" />
                <span>Clock In</span>
              </button>
              
              <button
                disabled={!todayRecord || (todayRecord.clock_out !== null && todayRecord.clock_out !== undefined)}
                onClick={handleClockOut}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-950 disabled:text-slate-600 disabled:border disabled:border-slate-850 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="h-4 w-4" />
                <span>Clock Out</span>
              </button>
            </div>
          </div>

          {/* History table (FEATURE 4) */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl lg:col-span-2 flex flex-col justify-between">
            <div className="p-6 pb-4 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight">Your Attendance History Log</h3>
              <span className="text-[10px] text-slate-500 font-mono">Newest First</span>
            </div>

            {loading ? (
              <Loader message="Fetching attendance slips..." />
            ) : history.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-950/20">
                      <th className="px-6 py-4">Calendar Date</th>
                      <th className="px-6 py-4">Clock In</th>
                      <th className="px-6 py-4">Clock Out</th>
                      <th className="px-6 py-4">Working Hours</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                    {history.map((rec) => (
                      <tr key={rec.id} className="hover:bg-zinc-800/10 transition-colors">
                        <td className="px-6 py-3.5 font-medium">{rec.date}</td>
                        <td className="px-6 py-3.5 font-mono text-zinc-400">{formatClockTime(rec.clock_in)}</td>
                        <td className="px-6 py-3.5 font-mono text-zinc-400">
                          {rec.clock_out ? formatClockTime(rec.clock_out) : <span className="text-zinc-600 italic">--</span>}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-blue-400 font-semibold">{rec.working_hours || rec.workingHours || '00h 00m'}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${getStatusBadge(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-500 font-mono text-xs">
                No timesheets recorded on file.
              </div>
            )}
          </div>
        </div>
      ) : (
        // ADMIN / HR VIEW (FEATURE 5)
        <div className="space-y-6">
          {/* Filters Row */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search */}
            <div className="relative w-full md:col-span-4">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Date Picker */}
            <div className="w-full md:col-span-3">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
              />
            </div>

            {/* Department Filter */}
            <div className="w-full md:col-span-3">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-[#0B0F19]">
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:col-span-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT" className="bg-[#0B0F19]">PRESENT</option>
                <option value="COMPLETED" className="bg-[#0B0F19]">COMPLETED</option>
                <option value="ABSENT" className="bg-[#0B0F19]">ABSENT</option>
                <option value="LATE" className="bg-[#0B0F19]">LATE</option>
                <option value="HALF_DAY" className="bg-[#0B0F19]">HALF DAY</option>
              </select>
            </div>
          </div>

          {/* Master Company Attendance Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {loading ? (
              <Loader message="Accessing active timesheets..." />
            ) : companyRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-mono font-bold uppercase tracking-wider bg-zinc-950/40">
                      <th className="px-6 py-4">Employee Name</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Clock In</th>
                      <th className="px-6 py-4">Clock Out</th>
                      <th className="px-6 py-4">Working Hours</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                    {companyRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{rec.first_name} {rec.last_name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{rec.emp_str_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{rec.date}</td>
                        <td className="px-6 py-4 text-xs text-zinc-400">{rec.department_name || <span className="text-zinc-650 italic">None</span>}</td>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-400">{formatClockTime(rec.clock_in)}</td>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                          {rec.clock_out ? formatClockTime(rec.clock_out) : <span className="text-zinc-650 italic">--</span>}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-blue-400 font-semibold">{rec.working_hours || rec.workingHours || '00h 00m'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${getStatusBadge(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Override attendance details"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttendance(rec.id)}
                              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-500 font-mono text-xs">
                No attendance logs found matching parameters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {isEditOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md z-10 text-slate-200">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Override Timesheet Status</h3>
            <p className="text-xs text-blue-400 font-semibold mb-6">
              {selectedRecord.first_name} {selectedRecord.last_name} ({selectedRecord.emp_str_id})
            </p>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Date</label>
                <input
                  type="date"
                  value={adjustDate}
                  onChange={(e) => setAdjustDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Operational Status</label>
                <select
                  value={adjustStatus}
                  onChange={(e) => setAdjustStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
                >
                  <option value="PRESENT" className="bg-[#0B0F19]">PRESENT</option>
                  <option value="COMPLETED" className="bg-[#0B0F19]">COMPLETED</option>
                  <option value="ABSENT" className="bg-[#0B0F19]">ABSENT</option>
                  <option value="LATE" className="bg-[#0B0F19]">LATE</option>
                  <option value="HALF_DAY" className="bg-[#0B0F19]">HALF DAY</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">Clock In Time</label>
                  <input
                    type="text"
                    value={adjustClockIn}
                    onChange={(e) => setAdjustClockIn(e.target.value)}
                    placeholder="09:00:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">Clock Out Time</label>
                  <input
                    type="text"
                    value={adjustClockOut}
                    onChange={(e) => setAdjustClockOut(e.target.value)}
                    placeholder="17:00:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all cursor-pointer"
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
