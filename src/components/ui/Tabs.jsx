import { colors, fonts, radii } from '../../lib/theme.js';

export default function Tabs({ items, value, onChange, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
        borderBottom: `1px solid ${colors.border}`,
        ...style,
      }}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange?.(item.value)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 13px 12px',
              border: 0,
              background: 'transparent',
              color: active ? colors.ink : colors.muted,
              fontFamily: fonts.body,
              fontSize: 12.5,
              fontWeight: active ? 600 : 400,
              letterSpacing: 0.2,
              transition: 'color .14s ease',
            }}
          >
            {item.label}
            {item.count !== undefined && item.count !== null ? (
              <span
                style={{
                  minWidth: 19,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: radii.pill,
                  background: active ? colors.champagne : '#F2ECE2',
                  color: active ? colors.goldDeep : colors.muted,
                  fontSize: 9.5,
                  fontWeight: 600,
                  display: 'inline-grid',
                  placeItems: 'center',
                }}
              >
                {item.count}
              </span>
            ) : null}
            {active ? (
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  bottom: -1,
                  height: 2,
                  background: colors.gold,
                  borderRadius: 2,
                }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
