import { colors, fonts } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

export function Thumb({ src, alt = '', size = 44, radius = 10, icon = 'gem', style }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: colors.cream,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        color: colors.faint,
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Icon name={icon} size={Math.max(14, size * 0.4)} />
      )}
    </div>
  );
}

export function StackedCell({ media, title, subtitle, meta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
      {media}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: 500,
            color: colors.ink,
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 300,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: 2,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 300,
            }}
          >
            {subtitle}
          </div>
        ) : null}
        {meta ? <div style={{ marginTop: 4 }}>{meta}</div> : null}
      </div>
    </div>
  );
}

export function KeyValue({ label, value, mono = false, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
      <span
        style={{
          fontSize: 9.5,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.faint,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: colors.inkSoft,
          lineHeight: 1.5,
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : fonts.body,
          wordBreak: 'break-word',
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

export function Divider({ style }) {
  return <div style={{ height: 1, background: colors.border, width: '100%', ...style }} />;
}

export function SectionTitle({ children, note, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, ...style }}>
      <h3
        style={{
          margin: 0,
          fontFamily: fonts.display,
          fontSize: 20,
          fontWeight: 600,
          color: colors.ink,
          letterSpacing: 0.1,
        }}
      >
        {children}
      </h3>
      {note ? <span style={{ fontSize: 11, color: colors.faint }}>{note}</span> : null}
    </div>
  );
}

export function CodeChip({ children }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 7px',
        borderRadius: 5,
        background: colors.cream,
        color: colors.inkSoft,
        fontSize: 10.5,
        letterSpacing: 0.6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function PageShell({ children, maxWidth }) {
  return (
    <div style={{ maxWidth: maxWidth || 1340, margin: '0 auto', animation: 'ga-fade-up .25s ease both' }}>{children}</div>
  );
}
