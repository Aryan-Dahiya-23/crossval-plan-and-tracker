'use client';

import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
} from '@remixicon/react';
import React, { createContext, useCallback, useContext, useState } from 'react';

import { cn } from '@/src/lib/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  title?: string | undefined;
  message: string;
};

type ToastContextType = {
  toast: {
    success: (message: string, title?: string | undefined) => void;
    error: (message: string, title?: string | undefined) => void;
    warning: (message: string, title?: string | undefined) => void;
    info: (message: string, title?: string | undefined) => void;
  };
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string | undefined) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // Auto-dismiss after 4.5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast],
  );

  const toastMethods = {
    success: (msg: string, title?: string | undefined) => addToast('success', msg, title),
    error: (msg: string, title?: string | undefined) => addToast('error', msg, title),
    warning: (msg: string, title?: string | undefined) => addToast('warning', msg, title),
    info: (msg: string, title?: string | undefined) => addToast('info', msg, title),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx.toast;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <RiCheckboxCircleLine className="size-5 text-success-base shrink-0" />,
  error: <RiErrorWarningLine className="size-5 text-error-base shrink-0" />,
  warning: <RiAlertLine className="size-5 text-warning-base shrink-0" />,
  info: <RiInformationLine className="size-5 text-primary-base shrink-0" />,
};

const TOAST_CONTAINER_STYLES: Record<ToastType, string> = {
  success: 'bg-bg-white-0 ring-success-base/30 text-text-strong-950',
  error: 'bg-bg-white-0 ring-error-base/30 text-text-strong-950',
  warning: 'bg-bg-white-0 ring-warning-base/30 text-text-strong-950',
  info: 'bg-bg-white-0 ring-primary-base/30 text-text-strong-950',
};

function ToastItem({ onClose, toast }: { toast: Toast; onClose: () => void }) {
  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-12 p-3.5 shadow-regular-md ring-1 ring-inset transition-all duration-300 animate-in fade-in slide-in-from-bottom-3',
        TOAST_CONTAINER_STYLES[toast.type],
      )}
    >
      {TOAST_ICONS[toast.type]}
      <div className="flex-1 text-paragraph-xs space-y-0.5">
        {toast.title && <p className="font-semibold text-text-strong-950">{toast.title}</p>}
        <p className="text-text-sub-600">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="rounded-6 p-0.5 text-text-soft-400 hover:text-text-strong-950 hover:bg-bg-weak-50"
        aria-label="Dismiss notification"
      >
        <RiCloseLine className="size-4" />
      </button>
    </div>
  );
}
