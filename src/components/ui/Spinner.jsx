import { colors } from '../../lib/theme.js';

export default function Spinner({ size = 18, color = colors.gold, thickness = 2, style }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `${thickness}px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'ga-spin .7s linear infinite',
        ...style,
      }}
    />
  );
}

export function PageLoader({ label = 'Opening the atelier…' }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: colors.muted,
      }}
    >
      <Spinner size={30} thickness={2.2} />
      <span style={{ fontSize: 12.5, letterSpacing: 0.4 }}>{label}</span>
    </div>
  );
}
