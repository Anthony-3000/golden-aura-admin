import { colors, fonts } from '../lib/theme.js';

export function Emblem({ size = 40, color = colors.gold, strokeWidth = 1.1 }) {
  const petals = [0, 45, 90, 135];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="32" cy="32" r="30" stroke={color} strokeWidth={strokeWidth * 0.7} opacity="0.35" />
      {petals.map((rotation) => (
        <ellipse
          key={rotation}
          cx="32"
          cy="19"
          rx="5.2"
          ry="11.5"
          stroke={color}
          strokeWidth={strokeWidth}
          transform={`rotate(${rotation} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="4.2" stroke={color} strokeWidth={strokeWidth} />
      <rect
        x="30.7"
        y="30.7"
        width="2.6"
        height="2.6"
        fill={color}
        transform="rotate(45 32 32)"
      />
      {[0, 90, 180, 270].map((rotation) => (
        <circle
          key={rotation}
          cx="32"
          cy="7.5"
          r="1.15"
          fill={color}
          transform={`rotate(${rotation} 32 32)`}
        />
      ))}
    </svg>
  );
}

export function Wordmark({ tone = 'dark', size = 17, tagline = true }) {
  const color = tone === 'light' ? colors.sidebarText : colors.ink;
  const accent = tone === 'light' ? colors.goldLight : colors.gold;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1 }}>
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: size,
          fontWeight: 600,
          letterSpacing: size * 0.19,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        GOLDEN AURA
      </span>
      {tagline ? (
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: Math.max(7, size * 0.42),
            letterSpacing: Math.max(1.8, size * 0.16),
            color: accent,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          Admin Atelier
        </span>
      ) : null}
    </div>
  );
}
