import { useAuth } from '../context/AuthContext';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ToastContainer() {
  const { toasts, removeToast } = useAuth();

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-start gap-3 border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-100'
                : 'bg-zinc-900/95 border-zinc-700/50 text-zinc-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-400" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-sky-400" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.text}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors p-0.5 rounded-md hover:bg-zinc-800/50"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
