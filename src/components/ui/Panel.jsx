import { colors, fonts, radii, shadows } from '../../lib/theme.js';

export default function Panel({
  children,
  title,
  subtitle,
  action,
  padding = 22,
  style,
  bodyStyle,
  bare = false,
}) {
  return (
    <section
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        overflow: 'hidden',
        ...style,
      }}
    >
      {title || action ? (
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: '18px 22px',
            borderBottom: `1px solid ${colors.border}`,
            background: 'linear-gradient(180deg, #FFFDF9, #FFFFFF)',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: fonts.display,
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: 0.2,
                color: colors.ink,
              }}
            >
              {title}
            </h2>
            {subtitle ? (
              <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.5, color: colors.muted }}>{subtitle}</p>
            ) : null}
          </div>
          {action ? <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{action}</div> : null}
        </header>
      ) : null}
      <div style={{ padding: bare ? 0 : padding, ...bodyStyle }}>{children}</div>
    </section>
  );
}
