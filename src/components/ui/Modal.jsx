import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors, fonts, radii, shadows } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 620,
  closeOnBackdrop = true,
  bodyStyle,
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(20, 14, 10, 0.58)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '6vh 16px 32px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: width,
          background: colors.bg,
          borderRadius: radii.xl,
          boxShadow: shadows.raised,
          border: `1px solid ${colors.border}`,
          animation: 'ga-fade-up .2s ease both',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 18,
            padding: '22px 24px 18px',
            borderBottom: `1px solid ${colors.border}`,
            background: 'linear-gradient(180deg, #FFFDF9, #FBF8F3)',
            borderRadius: `${radii.xl}px ${radii.xl}px 0 0`,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: fonts.display,
                fontSize: 26,
                fontWeight: 600,
                color: colors.ink,
                letterSpacing: 0.2,
                lineHeight: 1.15,
              }}
            >
              {title}
            </h2>
            {subtitle ? (
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: colors.muted, lineHeight: 1.55 }}>{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              borderRadius: radii.pill,
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              color: colors.muted,
              flexShrink: 0,
            }}
          >
            <Icon name="close" size={15} />
          </button>
        </header>
        <div style={{ padding: 24, ...bodyStyle }}>{children}</div>
        {footer ? (
          <footer
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: 10,
              padding: '16px 24px 20px',
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
