import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  CalendarCheck, 
  FileCheck, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function Reports() {
  const { apiFetch, showToast } = useAuth();
  
  const [loadingType, setLoadingType] = useState<string | null>(null);
  
  // Date range for attendance
  const [attendanceStart, setAttendanceStart] = useState('');
  const [attendanceEnd, setAttendanceEnd] = useState('');

  // Status for leaves
  const [leaveStatus, setLeaveStatus] = useState('');

  const triggerCSVDownload = async (endpoint: string, filename: string, loaderKey: string) => {
    try {
      setLoadingType(loaderKey);
      const csvData = await apiFetch(endpoint);
      
      // Build download blob
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(`Successfully compiled and downloaded ${filename}`, 'success');
    } catch (err: any) {
      console.error('CSV export failed:', err);
      showToast('Export failed. Could not pull data.', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  const handleExportEmployees = () => {
    triggerCSVDownload('/api/reports/employees?format=csv', 'employees_directory_report.csv', 'employees');
  };

  const handleExportAttendance = () => {
    let endpoint = '/api/reports/attendance?format=csv';
    if (attendanceStart) endpoint += `&start_date=${attendanceStart}`;
    if (attendanceEnd) endpoint += `&end_date=${attendanceEnd}`;
    
    triggerCSVDownload(endpoint, 'workforce_attendance_report.csv', 'attendance');
  };

  const handleExportLeaves = () => {
    let endpoint = '/api/reports/leaves?format=csv';
    if (leaveStatus) endpoint += `&status=${leaveStatus}`;
    
    triggerCSVDownload(endpoint, 'leave_applications_report.csv', 'leaves');
  };

  const handleExportPDFMock = async () => {
    try {
      const data = await apiFetch('/api/reports/pdf');
      showToast(data.message, 'info');
    } catch (err) {
      showToast('PDF compilation failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Corporate Reports & Auditing
        </h1>
        <p className="text-zinc-400 text-sm">
          Extract structured spreadsheets of employees, aggregate timesheets, and leave logs to audit organizational output.
        </p>
      </div>

      {/* Grid of Report modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Employee Report Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center rounded-lg mb-4">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Workforce Directory Report</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Consolidates full employee records, position summaries, salary distributions, departments, and active statuses.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/40">
            <button
              onClick={handleExportEmployees}
              disabled={loadingType !== null}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              <span>{loadingType === 'employees' ? 'Compiling CSV...' : 'Export Directory CSV'}</span>
            </button>
          </div>
        </div>

        {/* Attendance Report Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-lg mb-4">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Timesheet Attendance Logs</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed mb-4">
              Pulls punctual timesheets, custom Clock-In/Clock-Out timestamps, late marks, and attendance stats.
            </p>

            {/* Custom filters inside report */}
            <div className="space-y-2.5 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold">Filter Range</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={attendanceStart}
                    onChange={(e) => setAttendanceStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-white text-[11px] focus:outline-none focus:border-blue-500 text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={attendanceEnd}
                    onChange={(e) => setAttendanceEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-white text-[11px] focus:outline-none focus:border-blue-500 text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40">
            <button
              onClick={handleExportAttendance}
              disabled={loadingType !== null}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              <span>{loadingType === 'attendance' ? 'Compiling CSV...' : 'Export Timesheet CSV'}</span>
            </button>
          </div>
        </div>

        {/* Leave Requests Report Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-lg mb-4">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Leave Claims & Time-Off Reports</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed mb-4">
              Compiles applied leave types (Sick, Casual, Annual), dates, processing states, and approving admins.
            </p>

            <div className="space-y-2.5 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold">Status filter</span>
              <select
                value={leaveStatus}
                onChange={(e) => setLeaveStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1.5 text-white text-[11px] focus:outline-none focus:border-blue-500 text-slate-300"
              >
                <option value="" className="bg-[#0B0F19]">All statuses (APPROVED/PENDING/REJECTED)</option>
                <option value="PENDING" className="bg-[#0B0F19]">PENDING</option>
                <option value="APPROVED" className="bg-[#0B0F19]">APPROVED</option>
                <option value="REJECTED" className="bg-[#0B0F19]">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40">
            <button
              onClick={handleExportLeaves}
              disabled={loadingType !== null}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              <span>{loadingType === 'leaves' ? 'Compiling CSV...' : 'Export Leaves CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Future Reservation Alert banner */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6">
        <div className="flex gap-4 items-start md:items-center">
          <div className="p-3 bg-blue-950 border border-blue-800/30 rounded-xl text-blue-400 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Visual PDF Reports Generation Console</h4>
            <p className="text-xs text-slate-400 max-w-xl mt-1 leading-normal">
              PDF rendering modules using vector layers and print formatting grids are designated as future roadmap releases. 
              Review the implementation placeholder below.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportPDFMock}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold rounded-xl text-xs text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          Check PDF Connection
        </button>
      </div>
    </div>
  );
}
