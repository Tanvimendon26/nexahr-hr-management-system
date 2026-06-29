import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import { Department } from '../types';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Users, 
  BookOpen
} from 'lucide-react';

export default function Departments() {
  const { apiFetch, showToast } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Forms
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const url = `/api/departments?search=${encodeURIComponent(search)}`;
      const data = await apiFetch(url);
      setDepartments(data.departments);
    } catch (err) {
      console.error('Error fetching departments:', err);
      showToast('Could not retrieve departments list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [search]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    try {
      await apiFetch('/api/departments', {
        method: 'POST',
        body: JSON.stringify({ name: formName, description: formDescription }),
      });
      showToast('Department created successfully.', 'success');
      setIsAddOpen(false);
      resetForm();
      fetchDepartments();
    } catch (err: any) {
      console.error('Add dept error:', err);
      showToast(err.message || 'Failed to create department.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !formName) return;

    try {
      await apiFetch(`/api/departments/${selectedDept.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: formName, description: formDescription }),
      });
      showToast('Department updated successfully.', 'success');
      setIsEditOpen(false);
      setSelectedDept(null);
      resetForm();
      fetchDepartments();
    } catch (err: any) {
      console.error('Edit dept error:', err);
      showToast(err.message || 'Failed to update department.', 'error');
    }
  };

  const handleDeleteTrigger = (dept: Department) => {
    if (dept.employee_count && dept.employee_count > 0) {
      showToast(`Cannot delete ${dept.name}. It still contains ${dept.employee_count} active employees.`, 'error');
      return;
    }
    setConfirmDeleteId(dept.id);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiFetch(`/api/departments/${confirmDeleteId}`, { method: 'DELETE' });
      showToast('Department deleted successfully.', 'success');
      fetchDepartments();
    } catch (err: any) {
      console.error('Delete dept error:', err);
      showToast(err.message || 'Failed to delete department.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormName(dept.name);
    setFormDescription(dept.description || '');
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Departments Segment Console
          </h1>
          <p className="text-zinc-400 text-sm">
            Categorize active business layers, track employee allocation count, and enforce architectural structures.
          </p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/15 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search departments by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid of Department Cards */}
      {loading ? (
        <Loader message="Compiling corporate branches..." />
      ) : departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg pointer-events-none" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center rounded-lg">
                    <Building2 className="h-5 w-5" />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                      title="Edit Segment"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(dept)}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer text-xs"
                      title="Delete Segment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{dept.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed min-h-[3rem] line-clamp-2">
                  {dept.description || <span className="text-slate-600 italic">No operational summary description provided.</span>}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>{dept.employee_count} Allocated</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">ID: {dept.id}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-16 text-center shadow-xl">
          <BookOpen className="h-12 w-12 text-slate-650 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white">No Departments Listed</h3>
          <p className="text-xs text-slate-500 font-mono mt-1">Initialize the corporate structure by creating a branch.</p>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete Department"
        message="Are you sure you want to delete this department? This is a permanent schema operational override. This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
        isDestructive={true}
      />

      {/* ADD MODAL */}
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

            <h3 className="text-xl font-bold text-white mb-2">Create Department</h3>
            <p className="text-xs text-slate-400 mb-6">Append a new business division segment to the structural org-chart.</p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Segment Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                  placeholder="Engineering"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description Summary</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Design, development, and maintenance of SaaS solutions..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
                >
                  Establish Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md z-10 text-slate-200">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Modify Department</h3>
            <p className="text-xs text-slate-400 mb-6">Modify details regarding structural attributes.</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Segment Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description Summary</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedDept(null);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
                >
                  Save Branch Edits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
