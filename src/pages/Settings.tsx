import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Lock, 
  Building2, 
  KeyRound, 
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Settings() {
  const { user, apiFetch, showToast, companyName, updateCompanyNameInState } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // State for company name form (Admin only)
  const [inputCompanyName, setInputCompanyName] = useState(companyName);
  const [submittingCompany, setSubmittingCompany] = useState(false);

  // State for change password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Password visibility
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Handle company brand update
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCompanyName.trim()) {
      showToast('Company name cannot be blank.', 'error');
      return;
    }

    try {
      setSubmittingCompany(true);
      const data = await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ companyName: inputCompanyName }),
      });

      updateCompanyNameInState(data.companyName);
      showToast('Company name updated successfully across the suite.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update company name.', 'error');
    } finally {
      setSubmittingCompany(false);
    }
  };

  // Handle password modification
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

      showToast('Your security credentials have been updated successfully.', 'success');
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
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Security & Parameters Console
        </h1>
        <p className="text-zinc-400 text-sm">
          Coordinate global brand variables, adjust enterprise identifiers, and re-hash individual login credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings categories menu */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl h-fit space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold px-3 pb-2 block">Settings sections</span>
          
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-semibold">
            <Lock className="h-4 w-4 text-blue-400" />
            <span>Profile Credentials</span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 px-3 py-2.5 text-slate-400 rounded-xl text-xs font-semibold hover:text-white transition-colors">
              <Building2 className="h-4 w-4 text-slate-500" />
              <span>Company Branding</span>
            </div>
          )}
        </div>

        {/* Content columns */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Company Branding Settings (Admins only) */}
          {isAdmin && (
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg pointer-events-none" />
              
              <div className="flex gap-3.5 items-start mb-6">
                <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Enterprise Company Branding</h3>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Customize the corporate identity name printed across headers, cards, and reports.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateCompany} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Organizational Name</label>
                  <input
                    type="text"
                    required
                    value={inputCompanyName}
                    onChange={(e) => setInputCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingCompany}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer transition-all disabled:opacity-45"
                  >
                    {submittingCompany ? 'Saving Brand...' : 'Save Brand Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Settings */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg pointer-events-none" />

            <div className="flex gap-3.5 items-start mb-6">
              <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Security Credentials Override</h3>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Hash and record a new personal access password.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Old Password</label>
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer transition-all disabled:opacity-45"
                >
                  {submittingPassword ? 'Hashing credentials...' : 'Re-hash & Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
