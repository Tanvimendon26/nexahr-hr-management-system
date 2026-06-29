import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Clock, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="h-16 bg-[#0B0F19] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger menu */}
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand / Context Title */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm font-medium select-none md:inline hidden">Workspace</span>
          <span className="text-slate-600 md:inline hidden">/</span>
          <span className="text-white font-semibold text-sm">Dashboard Console</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Real-time Ticker */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/60 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-slate-400">
          <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
          <span>{formattedDate}</span>
          <span className="text-slate-600">•</span>
          <span className="text-white">{formattedTime}</span>
        </div>

        {/* Simple Profile Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right md:block hidden">
            <p className="text-xs font-medium text-white">{user?.email}</p>
            <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">{user?.role}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-300">
            <UserIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
