import { colors, fonts } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

export default function EmptyState({ icon = 'sparkle', title, description, action, compact = false, style }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '30px 18px' : '54px 22px',
        gap: 6,
        ...style,
      }}
    >
      <div
        style={{
          width: compact ? 42 : 54,
          height: compact ? 42 : 54,
          borderRadius: '50%',
          background: colors.champagne,
          color: colors.goldDeep,
          display: 'grid',
          placeItems: 'center',
          marginBottom: 8,
          border: `1px solid #EBD9B8`,
        }}
      >
        <Icon name={icon} size={compact ? 19 : 23} />
      </div>
      <h3
        style={{
          margin: 0,
          fontFamily: fonts.display,
          fontSize: compact ? 19 : 23,
          fontWeight: 600,
          color: colors.ink,
        }}
      >
        {title}
      </h3>
      {description ? (
        <p
          style={{
            margin: '2px 0 0',
            maxWidth: 430,
            fontSize: 12.5,
            lineHeight: 1.65,
            color: colors.muted,
          }}
        >
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}
