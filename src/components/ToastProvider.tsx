import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4" />,
  error: <XCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.25)', text: '#22C55E', icon: '#22C55E' },
  error:   { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', text: '#EF4444', icon: '#EF4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', text: '#F59E0B', icon: '#F59E0B' },
  info:    { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', text: '#3B82F6', icon: '#3B82F6' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — Fixed bottom-left */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '1.25rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          maxWidth: '420px',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const colors = TOAST_COLORS[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.625rem',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bg,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '0.6875rem',
                letterSpacing: '0.025em',
                color: colors.text,
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span style={{ color: colors.icon, flexShrink: 0, marginTop: '1px' }}>
                {TOAST_ICONS[toast.type]}
              </span>
              <span style={{ flex: 1, lineHeight: '1.45', color: '#CBD5E1' }}>
                {toast.message}
              </span>
              <button
                onClick={() => dismiss(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '2px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Keyframe animation injected via <style> */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
