import { colors, fonts } from '../../lib/theme.js';

export default function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 18,
        marginBottom: 24,
      }}
    >
      <div style={{ minWidth: 240, flex: '1 1 380px' }}>
        {eyebrow ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: colors.gold,
              marginBottom: 8,
            }}
          >
            <span style={{ width: 22, height: 1, background: colors.gold }} />
            {eyebrow}
          </div>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontFamily: fonts.display,
            fontSize: 'clamp(28px, 3vw, 38px)',
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: -0.2,
            color: colors.ink,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.65, color: colors.muted, maxWidth: 660 }}>
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9 }}>{actions}</div>
      ) : null}
    </div>
  );
}
