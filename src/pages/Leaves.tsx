import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { LeaveRequest } from '../types';
import { 
  FileText, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock, 
  User, 
  AlertCircle 
} from 'lucide-react';

export default function Leaves() {
  const { user, apiFetch, showToast } = useAuth();
  const isEmployee = user?.role === 'Employee';

  const [loading, setLoading] = useState(true);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [companyLeaves, setCompanyLeaves] = useState<LeaveRequest[]>([]);

  // Filter for admins
  const [filterStatus, setFilterStatus] = useState('PENDING');

  // Apply Form states
  const [formType, setFormType] = useState<'SICK' | 'CASUAL' | 'ANNUAL' | 'MATERNITY' | 'UNPAID'>('CASUAL');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  // Load appropriate lists
  const loadLeaves = async () => {
    try {
      setLoading(true);
      if (isEmployee) {
        const data = await apiFetch('/api/leaves/me');
        setMyLeaves(data.leaves || []);
      } else {
        const data = await apiFetch(`/api/leaves/company?status=${filterStatus}`);
        setCompanyLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error('Error loading leaves:', err);
      showToast('Could not load leave requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [filterStatus]);

  // Submit leave request
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStartDate || !formEndDate || !formReason) {
      showToast('Please fill in all leave request inputs.', 'error');
      return;
    }

    const start = new Date(formStartDate);
    const end = new Date(formEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      showToast('Invalid date format.', 'error');
      return;
    }

    if (start > end) {
      showToast('Start date cannot be after end date.', 'error');
      return;
    }

    try {
      await apiFetch('/api/leaves/apply', {
        method: 'POST',
        body: JSON.stringify({
          leave_type: formType,
          start_date: formStartDate,
          end_date: formEndDate,
          reason: formReason,
        }),
      });

      showToast('Leave request submitted successfully.', 'success');
      setFormStartDate('');
      setFormEndDate('');
      setFormReason('');
      loadLeaves();
    } catch (err: any) {
      console.error('Apply leave error:', err);
      showToast(err.message || 'Failed to submit leave request.', 'error');
    }
  };

  // Process a request (Approve/Reject)
  const handleProcessRequest = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiFetch(`/api/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      showToast(`Request has been ${status.toLowerCase()} successfully.`, 'success');
      loadLeaves();
    } catch (err: any) {
      console.error('Process request error:', err);
      showToast(err.message || 'Failed to update leave request.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Time-Off & Leave Management
        </h1>
        <p className="text-zinc-400 text-sm">
          {isEmployee 
            ? 'Request personal time-off, consult medical sick leave allocations, and review pending claims.' 
            : 'Audit company leave registers, approve sick sheets, and reference corporate calendars.'}
        </p>
      </div>

      {isEmployee ? (
        // EMPLOYEE SPLIT VIEW (Apply on Left, History on Right)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Apply Form Card */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">Request Time-Off</h3>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Leave Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
                >
                  <option value="CASUAL" className="bg-[#0B0F19]">Casual Leave</option>
                  <option value="SICK" className="bg-[#0B0F19]">Medical / Sick Leave</option>
                  <option value="ANNUAL" className="bg-[#0B0F19]">Annual Paid Vacation</option>
                  <option value="MATERNITY" className="bg-[#0B0F19]">Maternity / Parental Leave</option>
                  <option value="UNPAID" className="bg-[#0B0F19]">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Reason / Notes</label>
                <textarea
                  rows={4}
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Provide details regarding your request..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Submit Request</span>
              </button>
            </form>
          </div>

          {/* Individual History list */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl lg:col-span-2 flex flex-col justify-between">
            <div className="p-6 pb-2 border-b border-slate-800/60">
              <h3 className="text-sm font-bold text-white tracking-tight">Your Leave Request History</h3>
            </div>

            {loading ? (
              <Loader message="Fetching requests..." />
            ) : myLeaves.length > 0 ? (
              <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40">
                {myLeaves.map((leave) => (
                  <div key={leave.id} className="p-5 hover:bg-slate-800/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-white">{leave.leave_type} Leave</span>
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                          leave.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30'
                            : leave.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/30'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/30'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        <span>{leave.start_date} to {leave.end_date}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">{leave.reason}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-zinc-500 font-mono block">Applied On: {new Date(leave.created_at).toLocaleDateString()}</span>
                      {leave.status !== 'PENDING' && (
                        <span className="text-[10px] text-zinc-400 block mt-1">Processed By: <strong className="text-zinc-300 font-mono">{leave.approved_by_email || 'System'}</strong></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 text-zinc-500 font-mono text-xs">
                No leave logs found.
              </div>
            )}
          </div>
        </div>
      ) : (
        // ADMIN / HR REVIEW BOARD
        <div className="space-y-6">
          {/* Tabs row */}
          <div className="flex justify-between items-center bg-slate-900/50 border border-slate-800 p-3 rounded-3xl">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  filterStatus === 'PENDING' 
                    ? 'bg-amber-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Pending Requests
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  filterStatus === 'APPROVED' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Approved Logs
              </button>
              <button
                onClick={() => setFilterStatus('REJECTED')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  filterStatus === 'REJECTED' 
                    ? 'bg-rose-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Rejected Logs
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider mr-2 hidden md:inline">
              HR Review Queue
            </span>
          </div>

          {/* Company-wide list */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {loading ? (
              <Loader message="Loading leave queue..." />
            ) : companyLeaves.length > 0 ? (
              <div className="divide-y divide-slate-800/40 text-slate-300">
                {companyLeaves.map((leave) => (
                  <div key={leave.id} className="p-6 hover:bg-slate-800/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{leave.first_name} {leave.last_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">{leave.emp_str_id} • {leave.department_name || 'No Department'}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                          leave.leave_type === 'SICK' 
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/20' 
                            : 'bg-blue-950 text-blue-400 border border-blue-800/20'
                        }`}>
                          {leave.leave_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                        <span className="font-medium text-slate-300">{leave.start_date}</span>
                        <span className="text-slate-650">to</span>
                        <span className="font-medium text-slate-300">{leave.end_date}</span>
                      </div>

                      <p className="text-xs bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-400 font-normal leading-relaxed">
                        {leave.reason}
                      </p>
                    </div>

                    <div className="flex flex-row md:flex-col items-end shrink-0 gap-3 md:gap-1.5 w-full md:w-auto pt-3 md:pt-0 border-t border-zinc-800/40 md:border-t-0">
                      {leave.status === 'PENDING' ? (
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleProcessRequest(leave.id, 'APPROVED')}
                            className="flex-1 md:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleProcessRequest(leave.id, 'REJECTED')}
                            className="flex-1 md:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-1.5 ${
                            leave.status === 'APPROVED' 
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' 
                              : 'bg-rose-950/40 text-rose-400 border border-rose-800/30'
                          }`}>
                            {leave.status}
                          </span>
                          <p className="text-[10px] text-zinc-500 font-mono">Processed by: {leave.approved_by_email || 'System'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-500 font-mono text-xs">
                No leave requests found in this register.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
