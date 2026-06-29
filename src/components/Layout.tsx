import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ToastContainer from './Toast';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 flex font-sans antialiased">
      {/* Toast Alert Portal */}
      <ToastContainer />

      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Page Layout Frame */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
