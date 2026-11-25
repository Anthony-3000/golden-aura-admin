import { colors, fonts, radii } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

const TONES = {
  error: { bg: colors.dangerBg, border: '#EBC7BC', color: colors.danger, icon: 'alert' },
  success: { bg: colors.successBg, border: '#C6DAC7', color: colors.success, icon: 'check' },
  warning: { bg: colors.warningBg, border: '#EBD8AC', color: colors.warning, icon: 'alert' },
  info: { bg: colors.infoBg, border: '#C9D9E2', color: colors.info, icon: 'sparkle' },
};

export default function Alert({ tone = 'error', title, children, action, style }) {
  const palette = TONES[tone] || TONES.error;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'flex-start',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: radii.md,
        padding: '12px 14px',
        ...style,
      }}
    >
      <span style={{ color: palette.color, marginTop: 1 }}>
        <Icon name={palette.icon} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 12.5,
              fontWeight: 600,
              color: palette.color,
              marginBottom: 3,
            }}
          >
            {title}
          </div>
        ) : null}
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: colors.inkSoft }}>{children}</div>
      </div>
      {action}
    </div>
  );
}
