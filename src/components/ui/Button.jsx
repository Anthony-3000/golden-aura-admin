import { useState } from 'react';
import { colors, fonts, radii, shadows } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

const VARIANTS = {
  primary: {
    base: {
      background: `linear-gradient(135deg, ${colors.goldLight}, ${colors.gold} 55%, ${colors.goldDeep})`,
      color: '#FFFDF8',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: colors.goldDeep,
      boxShadow: shadows.gold,
    },
    hover: { filter: 'brightness(1.06)', transform: 'translateY(-1px)' },
  },
  secondary: {
    base: {
      background: colors.surface,
      color: colors.inkSoft,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: colors.borderStrong,
    },
    hover: { background: colors.cream, borderColor: colors.gold },
  },
  ghost: {
    base: { background: 'transparent', color: colors.inkSoft, border: '1px solid transparent' },
    hover: { background: colors.cream, color: colors.ink },
  },
  danger: {
    base: { background: colors.danger, color: '#FFF8F4', border: `1px solid ${colors.danger}` },
    hover: { filter: 'brightness(1.07)' },
  },
  dangerGhost: {
    base: { background: 'transparent', color: colors.danger, border: `1px solid ${colors.border}` },
    hover: { background: colors.dangerBg, borderColor: colors.danger },
  },
  dark: {
    base: { background: colors.ink, color: '#FCF6EC', border: `1px solid ${colors.ink}` },
    hover: { background: colors.sidebarAlt },
  },
};

const SIZES = {
  sm: { padding: '7px 12px', fontSize: 12, gap: 6, minHeight: 32 },
  md: { padding: '10px 17px', fontSize: 13.5, gap: 8, minHeight: 40 },
  lg: { padding: '13px 22px', fontSize: 14.5, gap: 9, minHeight: 46 },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  style,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);
  const theme = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyle = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sizeStyle.gap,
        padding: sizeStyle.padding,
        minHeight: sizeStyle.minHeight,
        fontFamily: fonts.body,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        letterSpacing: 0.2,
        borderRadius: radii.md,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        transition: 'all .16s ease',
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
        ...theme.base,
        ...(hovered && !isDisabled ? theme.hover : null),
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          style={{
            width: 14,
            height: 14,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: 'currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'ga-spin .7s linear infinite',
            opacity: 0.8,
          }}
        />
      ) : icon ? (
        <Icon name={icon} size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={size === 'sm' ? 14 : 16} /> : null}
    </button>
  );
}
