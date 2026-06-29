import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden z-10 text-zinc-100"
          >
            <div className="flex gap-4 items-start">
              <div className={`p-3 rounded-xl shrink-0 ${isDestructive ? 'bg-rose-950/50 text-rose-400 border border-rose-800/30' : 'bg-amber-950/50 text-amber-400 border border-amber-800/30'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-white mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all text-zinc-400"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-lg shadow-black/40 transition-all ${
                  isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
