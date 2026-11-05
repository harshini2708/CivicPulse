import React from 'react';
import { useComplaints } from '../../context/ComplaintContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useComplaints();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const bg =
          t.type === 'success'
            ? 'bg-on-tertiary-container text-white'
            : t.type === 'error'
            ? 'bg-error text-white'
            : t.type === 'warning'
            ? 'bg-secondary text-white'
            : 'bg-primary text-white';

        return (
          <div
            key={t.id}
            className={`${bg} pointer-events-auto p- space-md px-4 py-3 rounded-lg shadow-xl flex items-center justify-between gap-3 text-sm animate-fade-in backdrop-blur-md`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {t.type === 'success'
                  ? 'check_circle'
                  : t.type === 'error'
                  ? 'error'
                  : t.type === 'warning'
                  ? 'warning'
                  : 'info'}
              </span>
              <span className="font-medium leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/80 hover:text-white transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
