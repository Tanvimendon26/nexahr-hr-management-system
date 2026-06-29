import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff 
} from 'lucide-react';

export default function MyProfile() {
  const { user, apiFetch, showToast } = useAuth();
  
  // States for Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const emp = user?.employee;
  const role = user?.role || 'Employee';

  const getInitials = () => {
    if (emp && emp.first_name) {
      const f = emp.first_name[0] || '';
      const l = emp.last_name ? emp.last_name[0] : '';
      return `${f}${l}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      setSubmittingPassword(true);
      await apiFetch('/api/settings/change-password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      showToast('Password updated successfully.', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to modify password.', 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" id="profile-container">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans" id="profile-title">
          {role === 'HR' ? 'My HR Profile' : 'My Enterprise Profile'}
        </h1>
        <p className="text-zinc-400 text-sm">
          {role === 'HR' 
            ? 'Manage your HR profile credentials, administrative info, and security parameters.'
            : 'View your registered workspace credentials, status, and update your portal authentication keys.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl text-center flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-3xl font-bold uppercase select-none mb-4 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
              {getInitials()}
            </div>
            
            <h2 className="text-xl font-bold text-white leading-tight">
              {emp ? `${emp.first_name} ${emp.last_name}` : user?.email.split('@')[0]}
            </h2>
            <p className="text-xs text-blue-400 font-mono mt-1 font-semibold">{emp?.employee_id || 'EMP-TEMP'}</p>
            
            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full mt-3 border ${
              role === 'HR' 
                ? 'bg-amber-950/40 text-amber-400 border-amber-800/30' 
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30'
            }`}>
              Active {role} Member
            </span>

            <button
              type="button"
              onClick={() => showToast('Avatar updates will be available in a future version.', 'info')}
              className="mt-4.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:text-white text-[10px] font-bold rounded-xl text-slate-300 transition-all cursor-pointer"
            >
              Change Avatar
            </button>

            <div className="w-full border-t border-slate-800 mt-6 pt-5 space-y-3.5 text-left">
              <div className="flex items-center gap-3 text-slate-300">
                <Briefcase className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium">{emp?.position || (role === 'HR' ? 'HR Specialist' : 'NexaHR Associate')}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Building className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium">{emp?.department_name || 'General Operations'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium">Joined {emp?.joining_date || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information Sheet & Password Change */}
        <div className="md:col-span-2 space-y-6">
          {/* Detailed profile credentials */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <span>Account Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left border-t border-slate-800 pt-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Employee ID</span>
                <p className="text-sm font-semibold text-blue-400 font-mono mt-1">{emp?.employee_id || 'Not Assigned'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Role</span>
                <p className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                  <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                    role === 'HR' 
                      ? 'bg-amber-950/50 text-amber-400 border border-amber-800/30' 
                      : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/30'
                  }`}>
                    {role}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Department</span>
                <p className="text-sm font-semibold text-white mt-1">{emp?.department_name || 'Unallocated'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Position</span>
                <p className="text-sm font-semibold text-white mt-1">{emp?.position || (role === 'HR' ? 'HR Specialist' : 'Associate')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Joining Date</span>
                <p className="text-sm font-semibold text-white mt-1">{emp?.joining_date || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Email</span>
                <p className="text-sm font-semibold text-white mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-650" />
                  <span>{emp?.email || user?.email}</span>
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Phone</span>
                <p className="text-sm font-semibold text-white mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-650" />
                  <span>{emp?.phone || 'Not Entered'}</span>
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Status</span>
                <p className="text-sm font-semibold mt-1">
                  <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                    (emp?.status || 'ACTIVE') === 'ACTIVE'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-750/50'
                  }`}>
                    {emp?.status || 'ACTIVE'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Password Override */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg pointer-events-none" />

            <div className="flex gap-3.5 items-start mb-6">
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Modify Security Credentials</h3>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Change your temporary generated password to a secure personal key.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3.5 top-2.5 text-slate-500 hover:text-white transition-colors"
                  >
                    {showOld ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="At least 6 chars"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-2.5 text-slate-500 hover:text-white transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer transition-all disabled:opacity-45"
                >
                  {submittingPassword ? 'Saving changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
