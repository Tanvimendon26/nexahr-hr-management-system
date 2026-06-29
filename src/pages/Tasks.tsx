import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { Task, Employee } from '../types';
import { 
  CheckSquare, 
  Clock, 
  Plus, 
  Trash2, 
  X, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Edit2,
  Filter,
  Play
} from 'lucide-react';

export default function Tasks() {
  const { user, apiFetch, showToast } = useAuth();
  const isEmployee = user?.role === 'Employee';

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Admin/HR States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(''); // empty means "All Employees"
  
  // Task form state (Create)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignee, setFormAssignee] = useState('');
  const [formPriority, setFormPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Edit Task modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [editStatus, setEditStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('PENDING');

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadTasksData = async (isPoll = false) => {
    try {
      if (!isPoll) {
        setLoading(true);
      }
      if (isEmployee) {
        const data = await apiFetch('/api/tasks/me');
        setTasks(data.tasks || []);
      } else {
        // Load employees list for assignments
        const empData = await apiFetch('/api/employees');
        setEmployees(empData.employees || []);

        // Load tasks (filter by selected employee or all tasks)
        if (selectedEmpId) {
          const taskData = await apiFetch(`/api/tasks/employee/${selectedEmpId}`);
          setTasks(taskData.tasks || []);
        } else {
          const taskData = await apiFetch('/api/tasks');
          setTasks(taskData.tasks || []);
        }
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      if (!isPoll) {
        showToast('Could not fetch tasks list.', 'error');
      }
    } finally {
      if (!isPoll) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTasksData();

    // Poll every 5 seconds to keep the tasks list in sync automatically
    const interval = setInterval(() => {
      loadTasksData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedEmpId, isEmployee]);

  // Create Task (Admin/HR)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const assigneeId = parseInt(formAssignee);
    if (!formTitle || !formDueDate || !assigneeId) {
      showToast('Please fill in required task details.', 'error');
      return;
    }

    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: assigneeId,
          title: formTitle,
          description: formDesc,
          priority: formPriority,
          due_date: formDueDate,
        }),
      });

      showToast('Task assigned successfully.', 'success');
      setIsAddOpen(false);
      setFormTitle('');
      setFormDesc('');
      setFormDueDate('');
      setFormAssignee('');
      setFormPriority('Medium');
      
      // Refresh tasks
      loadTasksData();
    } catch (err: any) {
      console.error('Task creation failed:', err);
      showToast(err.message || 'Failed to assign task.', 'error');
    }
  };

  // Open Edit Task modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditDueDate(task.due_date);
    setEditAssignee(String(task.employee_id));
    setEditPriority(task.priority || 'Medium');
    setEditStatus(task.status || 'PENDING');
    setIsEditOpen(true);
  };

  // Update Task (Admin/HR)
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const assigneeId = parseInt(editAssignee);
    if (!editTitle || !editDueDate || !assigneeId) {
      showToast('Please fill in required task details.', 'error');
      return;
    }

    try {
      await apiFetch(`/api/tasks/edit/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          employee_id: assigneeId,
          title: editTitle,
          description: editDesc,
          priority: editPriority,
          due_date: editDueDate,
          status: editStatus,
        }),
      });

      showToast('Task updated successfully.', 'success');
      setIsEditOpen(false);
      setEditingTask(null);
      
      // Refresh tasks
      loadTasksData();
    } catch (err: any) {
      console.error('Task update failed:', err);
      showToast(err.message || 'Failed to update task.', 'error');
    }
  };

  // Update Task Status (Employee three-stage completion workflow)
  const handleUpdateStatus = async (taskId: number, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      const statusLabel = newStatus === 'COMPLETED' ? 'Completed' : newStatus === 'IN_PROGRESS' ? 'In Progress' : 'Pending';
      showToast(`Task status updated to ${statusLabel}.`, 'success');
      loadTasksData();
    } catch (err: any) {
      console.error('Task status update failed:', err);
      showToast(err.message || 'Failed to update task status.', 'error');
    }
  };

  // Delete Task Trigger
  const handleDeleteTask = (id: number) => {
    setDeleteConfirmId(id);
  };

  // Execute actual deletion
  const executeDeleteTask = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiFetch(`/api/tasks/${deleteConfirmId}`, { method: 'DELETE' });
      showToast('Task deleted successfully.', 'success');
      setDeleteConfirmId(null);
      loadTasksData();
    } catch (err: any) {
      console.error('Task deletion failed:', err);
      showToast(err.message || 'Failed to delete task.', 'error');
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'HIGH') return 'bg-rose-950/40 text-rose-400 border border-rose-800/30';
    if (p === 'MEDIUM') return 'bg-amber-950/40 text-amber-400 border border-amber-800/30';
    return 'bg-blue-950/40 text-blue-400 border border-blue-800/30';
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

  const formatCompletedTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Collaborative Tasks Coordinator
          </h1>
          <p className="text-zinc-400 text-sm">
            {isEmployee 
              ? 'Consult personal work duties, update activity checkpoints, and report progress.' 
              : 'Formulate core directives, assign deliverables to team members, and trace completion statuses.'}
          </p>
        </div>

        {!isEmployee && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {isEmployee ? (
        // EMPLOYEE VIEW (Simple board of tasks)
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800/60">
            <h3 className="text-sm font-bold text-white tracking-tight">Your Action Items</h3>
          </div>

          {loading ? (
            <Loader message="Fetching task directory..." />
          ) : tasks.length > 0 ? (
            <div className="divide-y divide-slate-800/40">
              {tasks.map((task) => (
                <div key={task.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/10 transition-colors">
                  <div className="space-y-1.5 text-left">
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

                    <h4 className={`text-sm font-bold ${task.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>{getDueDateText(task.due_date)}</span>
                      {task.assigned_by && (
                        <>
                          <span>•</span>
                          <span>Assigned by: {task.assigned_by}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2">
                    {task.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-lg border border-blue-900 bg-blue-950/20 hover:bg-blue-900/45 text-blue-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Start Task</span>
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-lg border border-emerald-900 bg-emerald-950/20 hover:bg-emerald-900/45 text-emerald-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                    {task.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'PENDING')}
                        className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Re-open Task</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 space-y-1">
              <p className="text-sm font-semibold">No assigned tasks.</p>
              <p className="text-xs text-slate-500">You're all caught up!</p>
            </div>
          )}
        </div>
      ) : (
        // ADMIN / HR VIEW
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Select Assignee List & Stats */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
              <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
                <Filter className="h-4.5 w-4.5 text-blue-400" />
                <span>Filter Directives</span>
              </h3>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono mb-2">Team Filter</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
                >
                  <option value="" className="bg-[#0B0F19]">-- All Employees --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-[#0B0F19]">
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2">
                  Choose a specific team member to view their active list or clear selection to browse all company assignments.
                </p>
              </div>
            </div>

            {/* Task Stats Card for HR */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-850 pb-2">Directive Checklist Metrics</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 col-span-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Total Tasks</span>
                  <span className="text-lg font-bold text-white">{tasks.length}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
                  <span className="text-[9px] font-mono text-amber-500 uppercase block mb-1">Pending</span>
                  <span className="text-lg font-bold text-amber-400">{tasks.filter(t => t.status === 'PENDING').length}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
                  <span className="text-[9px] font-mono text-sky-500 uppercase block mb-1">In Progress</span>
                  <span className="text-lg font-bold text-sky-400">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
                  <span className="text-[9px] font-mono text-emerald-500 uppercase block mb-1">Completed</span>
                  <span className="text-lg font-bold text-emerald-400">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 col-span-2">
                  <span className="text-[9px] font-mono text-rose-500 uppercase block mb-1">Overdue</span>
                  <span className="text-lg font-bold text-rose-400">
                    {tasks.filter(t => {
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      return t.status !== 'COMPLETED' && t.due_date < todayStr;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Tasks list */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl lg:col-span-2 flex flex-col justify-between min-h-[300px]">
            <div className="p-6 pb-2 border-b border-slate-800/60">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {selectedEmpId 
                  ? 'Active Directives for Selected Employee' 
                  : 'All Assigned Company Directives'}
              </h3>
            </div>

            {loading ? (
              <Loader message="Loading assigned directives..." />
            ) : tasks.length > 0 ? (
              <div className="divide-y divide-slate-800/40 flex-1">
                {tasks.map((task) => (
                  <div key={task.id} className="p-5 hover:bg-slate-800/10 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                    <div className="space-y-1.5">
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
                      
                      <h4 className="text-sm font-bold text-white">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-400 max-w-lg leading-relaxed">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        <span>{getDueDateText(task.due_date)}</span>
                        {task.first_name && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300">Assignee: {task.first_name} {task.last_name} ({task.emp_id || task.employee_id})</span>
                          </>
                        )}
                        {task.assigned_by && (
                          <>
                            <span>•</span>
                            <span>By: {task.assigned_by}</span>
                          </>
                        )}
                        {task.status === 'COMPLETED' && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">Completed By: {task.completedBy || 'Employee'}</span>
                            {task.completedAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">Completed Time: {formatCompletedTime(task.completedAt)}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 transition-all cursor-pointer"
                        title="Edit directive"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 transition-all cursor-pointer"
                        title="Delete directive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-500 font-mono text-xs px-6">
                {selectedEmpId 
                  ? 'No active task directives found for this individual.' 
                  : 'No task directives assigned in the system.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md z-10 text-slate-200">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Create Task Directive</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">Assign work items with deadline indicators.</p>

            <form onSubmit={handleCreateTask} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Task Assignee *</label>
                <select
                  required
                  value={formAssignee}
                  onChange={(e) => setFormAssignee(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
                >
                  <option value="" className="bg-[#0B0F19]">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-[#0B0F19]">
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Directive Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                  placeholder="Review quarter metrics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Priority *</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 text-slate-200"
                  >
                    <option value="Low" className="bg-[#0B0F19]">Low</option>
                    <option value="Medium" className="bg-[#0B0F19]">Medium</option>
                    <option value="High" className="bg-[#0B0F19]">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description details</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Outline active achievements, pipeline statuses, and client ratios..."
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all animate-pulse-subtle"
                >
                  Delegate Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {isEditOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => { setIsEditOpen(false); setEditingTask(null); }} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md z-10 text-slate-200">
            <button
              onClick={() => { setIsEditOpen(false); setEditingTask(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Edit Task Directive</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">Modify assignment details, priority, and current status.</p>

            <form onSubmit={handleUpdateTask} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Task Assignee *</label>
                <select
                  required
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 text-slate-200"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-[#0B0F19]">
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Directive Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Priority *</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 text-slate-200"
                  >
                    <option value="Low" className="bg-[#0B0F19]">Low</option>
                    <option value="Medium" className="bg-[#0B0F19]">Medium</option>
                    <option value="High" className="bg-[#0B0F19]">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 text-slate-200"
                >
                  <option value="PENDING" className="bg-[#0B0F19]">Pending</option>
                  <option value="IN_PROGRESS" className="bg-[#0B0F19]">In Progress</option>
                  <option value="COMPLETED" className="bg-[#0B0F19]">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description details</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setEditingTask(null); }}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TASK CONFIRMATION DIALOG */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm z-10 text-slate-200 text-center space-y-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800/30 flex items-center justify-center text-rose-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Delete this task?</h3>
              <p className="text-xs text-slate-400">This action is permanent and cannot be undone.</p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteTask}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
