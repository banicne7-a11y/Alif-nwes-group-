import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toast, ToastMessage, ConfirmDialogOptions } from '../../services/toast';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  useEffect(() => {
    const unsubToasts = toast.subscribe(setToasts);
    const unsubConfirm = toast.subscribeConfirm(setConfirmDialog);
    return () => {
      unsubToasts();
      unsubConfirm();
    };
  }, []);

  return (
    <>
      {/* Toast notifications stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
                isSuccess
                  ? 'bg-slate-900/95 text-white border-emerald-500/50'
                  : isError
                  ? 'bg-red-950/95 text-white border-red-500/50'
                  : isWarning
                  ? 'bg-amber-950/95 text-white border-amber-500/50'
                  : 'bg-slate-900/95 text-white border-sky-500/50'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-relaxed break-words">{t.message}</p>
              </div>

              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global In-App Confirm Dialog (Replaces blocked window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  confirmDialog.isDestructive ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'
                }`}
              >
                {confirmDialog.isDestructive ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  toast.closeConfirm();
                }}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  toast.closeConfirm();
                }}
                className={`px-4 py-2 font-bold text-white rounded-xl transition-all shadow-xs cursor-pointer ${
                  confirmDialog.isDestructive
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {confirmDialog.confirmLabel || (confirmDialog.isDestructive ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
