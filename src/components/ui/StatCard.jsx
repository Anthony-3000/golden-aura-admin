import { Link } from 'react-router-dom';
import { colors, fonts, radii, shadows } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

const TONES = {
  gold: { iconBg: colors.champagne, iconColor: colors.goldDeep, bar: colors.gold },
  success: { iconBg: colors.successBg, iconColor: colors.success, bar: colors.success },
  warning: { iconBg: colors.warningBg, iconColor: colors.warning, bar: colors.warning },
  info: { iconBg: colors.infoBg, iconColor: colors.info, bar: colors.info },
  danger: { iconBg: colors.dangerBg, iconColor: colors.danger, bar: colors.danger },
};

export default function StatCard({ label, value, hint, icon = 'sparkle', tone = 'gold', to, loading = false, style }) {
  const palette = TONES[tone] || TONES.gold;
  const content = (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '18px 18px 17px',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        overflow: 'hidden',
        height: '100%',
        transition: 'transform .16s ease, box-shadow .16s ease',
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${palette.bar}, transparent 78%)`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: colors.muted,
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: palette.iconBg,
            color: palette.iconColor,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={16} />
        </span>
      </div>
      {loading ? (
        <div
          style={{
            height: 34,
            width: '45%',
            borderRadius: 7,
            background: 'linear-gradient(90deg, #F1E9DD 25%, #F8F3EA 50%, #F1E9DD 75%)',
            backgroundSize: '200% 100%',
            animation: 'ga-shimmer 1.4s infinite linear',
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: fonts.display,
            fontSize: 36,
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: -0.5,
            color: colors.ink,
          }}
        >
          {value ?? '—'}
        </span>
      )}
      <span style={{ fontSize: 11.5, color: colors.faint, lineHeight: 1.4 }}>{hint}</span>
    </div>
  );

  return to ? (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      {content}
    </Link>
  ) : (
    content
  );
}
