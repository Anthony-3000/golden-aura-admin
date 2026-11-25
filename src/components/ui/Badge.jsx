import { colors, fonts, radii } from '../../lib/theme.js';
import { STATUS_TONES } from '../../lib/constants.js';

const TONES = {
  neutral: { bg: '#F3EDE4', color: colors.muted, dot: colors.faint },
  gold: { bg: colors.champagne, color: colors.goldDeep, dot: colors.gold },
  success: { bg: colors.successBg, color: colors.success, dot: colors.success },
  danger: { bg: colors.dangerBg, color: colors.danger, dot: colors.danger },
  warning: { bg: colors.warningBg, color: colors.warning, dot: colors.warning },
  info: { bg: colors.infoBg, color: colors.info, dot: colors.info },
  dark: { bg: '#2C2119', color: '#EFE4D3', dot: colors.goldLight },
};

export default function Badge({ children, tone = 'neutral', dot = true, style }) {
  const palette = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 9px',
        borderRadius: radii.pill,
        background: palette.bg,
        color: palette.color,
        fontFamily: fonts.body,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: 0.45,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: palette.dot, flexShrink: 0 }} />
      ) : null}
      {children}
    </span>
  );
}

export function StatusBadge({ status, style }) {
  return (
    <Badge tone={STATUS_TONES[status] || 'neutral'} style={style}>
      {status || '—'}
    </Badge>
  );
}
