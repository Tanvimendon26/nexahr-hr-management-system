import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CalendarCheck, 
  FileCheck, 
  FileSpreadsheet, 
  CheckSquare, 
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, companyName } = useAuth();
  const role = user?.role || 'Employee';

  const menuItemsMap = {
    Admin: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Employees', path: '/employees', icon: Users },
      { name: 'Departments', path: '/departments', icon: Building2 },
      { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare },
      { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
      { name: 'Settings', path: '/settings', icon: SettingsIcon },
    ],
    HR: [
      { name: 'Dashboard', path: '/hr', icon: LayoutDashboard },
      { name: 'My Profile', path: '/profile', icon: UserIcon },
      { name: 'Employees', path: '/employees', icon: Users },
      { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { name: 'Leave Requests', path: '/leaves', icon: FileCheck },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    ],
    Employee: [
      { name: 'Dashboard', path: '/employee', icon: LayoutDashboard },
      { name: 'My Profile', path: '/profile', icon: UserIcon },
      { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    ]
  };

  const allowedItems = menuItemsMap[role as 'Admin' | 'HR' | 'Employee'] || menuItemsMap.Employee;

  return (
    <>
      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-45 w-64 bg-[#0B0F19] border-r border-slate-800 flex flex-col transition-transform duration-300 transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white leading-tight tracking-tight text-lg font-sans">
              {companyName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              Management Suite
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold uppercase select-none">
            {user?.email[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.email.split('@')[0]}</p>
            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded mt-0.5 ${
              role === 'Admin'
                ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30'
                : role === 'HR'
                ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
            }`}>
              {role}
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.05)]'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
