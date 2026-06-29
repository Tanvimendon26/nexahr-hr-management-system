import { Loader2 } from 'lucide-react';

export default function Loader({ fullPage = false, message = 'Loading records...' }: { fullPage?: boolean; message?: string }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-[#0B0F19]/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-slate-100">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-slate-300 font-medium text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
      <span className="text-xs font-mono">{message}</span>
    </div>
  );
}
