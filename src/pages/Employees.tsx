import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import { Employee, Department, UserRole } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Lock, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

export default function Employees() {
  const { apiFetch, showToast, user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const roleQuery = searchParams.get('role');

  // Primary states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Temp Password reveal state
  const [revealedTempPassword, setRevealedTempPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    temporaryPassword: string;
  } | null>(null);

  // Active items
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formRole, setFormRole] = useState<UserRole>('Employee');

  // Load employee directory
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const url = `/api/employees?search=${encodeURIComponent(search)}&department_id=${deptFilter}&status=${statusFilter}&role=${roleQuery || ''}&limit=${limit}&offset=${offset}`;
      const data = await apiFetch(url);
      setEmployees(data.employees);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching employees:', err);
      showToast('Could not retrieve employee list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load supporting departments
  const fetchDepartments = async () => {
    try {
      const data = await apiFetch('/api/departments');
      setDepartments(data.departments);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [search, deptFilter, statusFilter, page, roleQuery]);

  // Reset form inputs
  const resetForm = () => {
    setFormEmail('');
    setFormFirstName('');
    setFormLastName('');
    setFormPhone('');
    setFormDeptId('');
    setFormPosition('');
    setFormSalary('');
    setFormJoiningDate('');
    setFormStatus('ACTIVE');
    setFormRole('Employee');
  };

  // Submit employee registration
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          first_name: formFirstName,
          last_name: formLastName,
          email: formEmail,
          phone: formPhone,
          department_id: formDeptId ? parseInt(formDeptId) : null,
          position: formPosition,
          salary: parseFloat(formSalary),
          joining_date: formJoiningDate,
          role: formRole
        }),
      });

      showToast('Employee profile and user account registered.', 'success');
      setIsCreateOpen(false);
      resetForm();
      fetchEmployees();

      // Display the success modal with the temp password and details exactly once
      if (response.employee && response.temporaryPassword) {
        setCreatedAccount({
          employee_id: response.employee.employee_id,
          first_name: response.employee.first_name,
          last_name: response.employee.last_name,
          email: response.employee.email,
          role: response.employee.role || response.employee.user_role || formRole,
          temporaryPassword: response.temporaryPassword,
        });
        setRevealedTempPassword(response.temporaryPassword);
      }
    } catch (err: any) {
      console.error('Create error:', err);
      showToast(err.message || 'Failed to register employee.', 'error');
    }
  };

  // Handle edit fill
  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormFirstName(emp.first_name);
    setFormLastName(emp.last_name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone);
    setFormDeptId(emp.department_id ? String(emp.department_id) : '');
    setFormPosition(emp.position);
    setFormSalary(String(emp.salary));
    setFormJoiningDate(emp.joining_date);
    setFormStatus(emp.status);
    setFormRole(emp.user_role || 'Employee');
    setIsEditOpen(true);
  };

  // Submit profile edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      await apiFetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          first_name: formFirstName,
          last_name: formLastName,
          phone: formPhone,
          department_id: formDeptId ? parseInt(formDeptId) : null,
          position: formPosition,
          salary: parseFloat(formSalary),
          joining_date: formJoiningDate,
          status: formStatus,
          role: formRole
        }),
      });

      showToast('Employee profile updated.', 'success');
      setIsEditOpen(false);
      resetForm();
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      console.error('Update error:', err);
      showToast(err.message || 'Failed to update employee.', 'error');
    }
  };

  // Handle delete trigger
  const triggerDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiFetch(`/api/employees/${confirmDeleteId}`, { method: 'DELETE' });
      showToast('Employee deleted successfully.', 'success');
      fetchEmployees();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(err.message || 'Failed to delete employee.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleCopyPassword = () => {
    if (!revealedTempPassword) return;
    navigator.clipboard.writeText(revealedTempPassword);
    setPasswordCopied(true);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            {roleQuery === 'HR' ? 'HR Management' : 'Workforce Directory'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {roleQuery === 'HR' 
              ? 'Oversee and coordinate HR officers, update privilege access, and inspect personnel logs.'
              : 'Maintain employee data sheets, coordinate operational departments, and issue temporary access passes.'}
          </p>
        </div>
        
        {/* Create Employee button */}
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15 flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Temp Password Showcase banner (Shows exactly once until closed) */}
      {revealedTempPassword && (
        <div className="bg-slate-900/50 border-2 border-blue-500/30 p-6 rounded-3xl relative shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          
          <button
            onClick={() => setRevealedTempPassword(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex gap-4 items-start max-w-2xl">
            <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded-xl text-blue-400 shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>Employee Account Created Successfully</span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded">
                  Temporary Key
                </span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                This temporary authentication key has been generated for the employee. 
                <strong className="text-amber-400 block mt-1">IMPORTANT: Store this key now. It will NEVER be shown again!</strong>
              </p>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-3 rounded-xl max-w-sm">
                <code className="text-sm font-mono font-extrabold text-white flex-1">{revealedTempPassword}</code>
                <button
                  onClick={handleCopyPassword}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                >
                  {passwordCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by first name, employee ID, position, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-3 w-full md:w-auto shrink-0">
          {/* Department */}
          <div className="relative flex-1 md:w-48">
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-all text-slate-200"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#0B0F19] text-white">{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="relative flex-1 md:w-40">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-all text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE" className="bg-[#0B0F19] text-white">ACTIVE</option>
              <option value="INACTIVE" className="bg-[#0B0F19] text-white">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <Loader message="Compiling team directory files..." />
        ) : employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-mono font-bold uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Business Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/20 transition-colors text-slate-300">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-400">{emp.employee_id}</td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-6 py-4 text-xs">{emp.email}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {emp.department_name || <span className="text-slate-600 italic">None</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{emp.position}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const r = emp.user_role || 'Employee';
                        if (r === 'Admin') {
                          return (
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-purple-950/50 text-purple-400 border border-purple-800/30 uppercase tracking-wider">
                              Admin
                            </span>
                          );
                        } else if (r === 'HR') {
                          return (
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-blue-950/50 text-blue-400 border border-blue-800/30 uppercase tracking-wider">
                              HR
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/40 uppercase tracking-wider">
                              Employee
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-750/50'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Profile */}
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsViewOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 transition-all cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Profile */}
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 transition-all cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete Profile */}
                        {currentUser?.email !== emp.email && (
                          <button
                            onClick={() => triggerDelete(emp.id)}
                            className="p-1.5 rounded-lg border border-rose-950 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 transition-all cursor-pointer"
                            title="Delete Profile"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm font-semibold">No employees found matching the filters.</p>
            <p className="text-slate-600 text-xs font-mono mt-1">Please register a new record to get started.</p>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span> (Total <span className="text-white">{total}</span> records)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Confirm Employee Deletion"
        message="Are you absolutely sure you want to delete this employee? This will permanently wipe their core database profile, attendance history, leave request sheets, and user access credentials. This is irreversible."
        confirmText="Permanently Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
        isDestructive={true}
      />

      {/* VIEW MODAL */}
      {isViewOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsViewOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg z-10 text-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsViewOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex gap-4 items-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl font-bold uppercase select-none shrink-0">
                {selectedEmployee.first_name[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                <span className="text-xs font-mono font-semibold text-blue-400 block mt-0.5">{selectedEmployee.employee_id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-slate-800 pt-5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Email Address</span>
                <p className="text-sm font-medium text-white mt-0.5">{selectedEmployee.email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Phone Connection</span>
                <p className="text-sm font-medium text-white mt-0.5">{selectedEmployee.phone}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Department Segment</span>
                <p className="text-sm font-medium text-white mt-0.5">{selectedEmployee.department_name || <span className="text-slate-650 italic">Unassigned</span>}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Position / Job Role</span>
                <p className="text-sm font-medium text-white mt-0.5">{selectedEmployee.position}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Annual Salary</span>
                <p className="text-sm font-medium text-emerald-400 font-mono mt-0.5">${selectedEmployee.salary?.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Joining Date</span>
                <p className="text-sm font-medium text-white mt-0.5">{selectedEmployee.joining_date}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Operational Status</span>
                <div className="mt-1">
                  <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                    selectedEmployee.status === 'ACTIVE'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-750/50'
                  }`}>
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Portal User Role</span>
                <p className="text-sm font-medium text-white mt-0.5">{selectedEmployee.user_role || 'EMPLOYEE'}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all hover:text-white"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CREDENTIALS MODAL */}
      {createdAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCreatedAccount(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md z-10 text-slate-200">
            <button
              onClick={() => setCreatedAccount(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-full text-emerald-400 mb-3 animate-pulse">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {createdAccount.role === 'HR' ? 'HR Account Created Successfully' : 'Employee Account Created Successfully'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                The security system has successfully registered and activated the profile.
              </p>
            </div>

            <div className="space-y-3.5 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl mb-5">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Employee ID</span>
                <span className="col-span-2 text-white font-mono font-bold text-right">{createdAccount.employee_id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-900 pt-2.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Full Name</span>
                <span className="col-span-2 text-white font-medium text-right">{createdAccount.first_name} {createdAccount.last_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-900 pt-2.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Work Email</span>
                <span className="col-span-2 text-white break-all text-right">{createdAccount.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-900 pt-2.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Privilege Role</span>
                <span className="col-span-2 text-right">
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-950/40 text-blue-400 border border-blue-800/30">
                    {createdAccount.role}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-900 pt-2.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Temporary Password</span>
                <span className="col-span-2 text-amber-400 font-mono font-extrabold text-right">{createdAccount.temporaryPassword}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <code className="text-sm font-mono font-extrabold text-white flex-1">{createdAccount.temporaryPassword}</code>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(createdAccount.temporaryPassword);
                      showToast('Temporary password copied successfully.', 'success');
                    } catch (err) {
                      try {
                        const textArea = document.createElement("textarea");
                        textArea.value = createdAccount.temporaryPassword;
                        textArea.style.position = "absolute";
                        textArea.style.opacity = "0";
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textArea);
                        showToast('Temporary password copied successfully.', 'success');
                      } catch (fallbackErr) {
                        showToast('Failed to copy temporary password.', 'error');
                      }
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-[10px] text-amber-500 font-semibold leading-relaxed text-center">
                ⚠️ IMPORTANT: Copy this key now. It will NEVER be shown again!
              </p>

              <button
                onClick={() => setCreatedAccount(null)}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15 cursor-pointer text-center"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg z-10 text-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Register Employee</h3>
            <p className="text-xs text-slate-400 mb-6">
              Creates a master profile. The system automatically provisions a user account and issues a temporary password.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Work Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                  placeholder="jane.doe@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Connection</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Department</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    disabled={departments.length === 0}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200 disabled:opacity-50"
                  >
                    <option value="" className="bg-[#0B0F19]">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-[#0B0F19]">{d.name}</option>
                    ))}
                  </select>
                  {departments.length === 0 && (
                    <p className="text-[10px] text-amber-500 mt-1">No departments available. Please create a department first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Position / Title</label>
                  <input
                    type="text"
                    required
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Annual Salary ($)</label>
                  <input
                    type="number"
                    required
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                    placeholder="95000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">User Privilege Role</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="role"
                      value="Employee"
                      checked={formRole === 'Employee'}
                      onChange={() => setFormRole('Employee')}
                      className="accent-blue-500"
                    />
                    <span>Employee</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="role"
                      value="HR"
                      checked={formRole === 'HR'}
                      onChange={() => setFormRole('HR')}
                      className="accent-blue-500"
                    />
                    <span>HR</span>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
                >
                  Create Master File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg z-10 text-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Edit Employee Profile</h3>
            <p className="text-xs text-slate-400 mb-6">Modify operational variables and structural properties.</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Work Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={formEmail}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-500 focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Connection</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Department</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    disabled={departments.length === 0}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200 disabled:opacity-50"
                  >
                    <option value="" className="bg-[#0B0F19]">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-[#0B0F19]">{d.name}</option>
                    ))}
                  </select>
                  {departments.length === 0 && (
                    <p className="text-[10px] text-amber-500 mt-1">No departments available. Please create a department first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Position / Title</label>
                  <input
                    type="text"
                    required
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Annual Salary ($)</label>
                  <input
                    type="number"
                    required
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Operational Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
                  >
                    <option value="ACTIVE" className="bg-[#0B0F19]">ACTIVE</option>
                    <option value="INACTIVE" className="bg-[#0B0F19]">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">User Privilege Role</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="edit-role"
                        value="Employee"
                        checked={formRole === 'Employee'}
                        onChange={() => setFormRole('Employee')}
                        className="accent-blue-500"
                      />
                      <span>Employee</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="edit-role"
                        value="HR"
                        checked={formRole === 'HR'}
                        onChange={() => setFormRole('HR')}
                        className="accent-blue-500"
                      />
                      <span>HR</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
