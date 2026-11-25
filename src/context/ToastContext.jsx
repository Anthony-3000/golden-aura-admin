import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { colors, fonts, radii, shadows } from '../lib/theme.js';
import Icon from '../components/Icon.jsx';

const ToastContext = createContext(null);

const TONE = {
  success: { bar: colors.success, wash: colors.successBg, icon: 'check' },
  error: { bar: colors.danger, wash: colors.dangerBg, icon: 'alert' },
  info: { bar: colors.gold, wash: colors.champagne, icon: 'sparkle' },
  warning: { bar: colors.warning, wash: colors.warningBg, icon: 'alert' },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (type, message, title) => {
      if (!message) return;
      const id = nextId += 1;
      setToasts((list) => [...list.slice(-3), { id, type, message, title }]);
      const timer = window.setTimeout(() => dismiss(id), type === 'error' ? 6500 : 4200);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const toast = useMemo(
    () => ({
      success: (message, title = 'Saved') => push('success', message, title),
      error: (message, title = 'Something went wrong') => push('error', message, title),
      info: (message, title = 'Notice') => push('info', message, title),
      warning: (message, title = 'Check this') => push('warning', message, title),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: 'min(380px, calc(100vw - 32px))',
            pointerEvents: 'none',
          }}
        >
          {toasts.map((toastItem) => {
            const tone = TONE[toastItem.type] || TONE.info;
            return (
              <div
                key={toastItem.id}
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  gap: 12,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `3px solid ${tone.bar}`,
                  borderRadius: radii.md,
                  padding: '13px 14px',
                  boxShadow: shadows.raised,
                  animation: 'ga-toast-in .22s ease both',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radii.pill,
                    background: tone.wash,
                    color: tone.bar,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={tone.icon} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {toastItem.title ? (
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: colors.ink,
                        marginBottom: 2,
                      }}
                    >
                      {toastItem.title}
                    </div>
                  ) : null}
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: colors.inkSoft }}>{toastItem.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toastItem.id)}
                  aria-label="Dismiss notification"
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: colors.faint,
                    padding: 2,
                    height: 22,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
