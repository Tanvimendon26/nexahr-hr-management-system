import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-rose-950/45 border border-rose-500/20 text-rose-400 flex items-center justify-center rounded-xl mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Access Denied</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Your account role does not have the necessary security credentials to view this section of the NexaHR platform.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-medium text-sm transition-all text-white border border-zinc-700/50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
