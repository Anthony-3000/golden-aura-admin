import { useState } from 'react';
import { colors, fonts, radii } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

const SKELETON = {
  background: 'linear-gradient(90deg, #F1E9DD 25%, #F8F3EA 50%, #F1E9DD 75%)',
  backgroundSize: '200% 100%',
  animation: 'ga-shimmer 1.4s infinite linear',
  borderRadius: 6,
};

export default function DataTable({
  columns,
  rows = [],
  rowKey = (row, index) => row.id ?? row._id ?? index,
  loading = false,
  empty,
  onRowClick,
  rowStyle,
  minWidth = 760,
  footer,
  style,
}) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', minWidth, borderCollapse: 'collapse', fontFamily: fonts.body }}>
        <thead>
          <tr style={{ background: '#FCF9F4' }}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: column.align || 'left',
                  padding: '11px 16px',
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: 1.3,
                  textTransform: 'uppercase',
                  color: colors.muted,
                  borderBottom: `1px solid ${colors.border}`,
                  whiteSpace: 'nowrap',
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column.key} style={{ padding: '15px 16px', borderBottom: `1px solid #F3ECE1` }}>
                      <div style={{ height: 12, width: column.skeletonWidth || '70%', ...SKELETON }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row, index) => {
                const key = rowKey(row, index);
                return (
                  <tr
                    key={key}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      background: hovered === key ? '#FCF8F1' : 'transparent',
                      transition: 'background .14s ease',
                      ...(rowStyle ? rowStyle(row) : null),
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={{
                          padding: '13px 16px',
                          borderBottom: `1px solid #F3ECE1`,
                          verticalAlign: 'middle',
                          textAlign: column.align || 'left',
                          fontSize: 13,
                          color: colors.inkSoft,
                        }}
                      >
                        {column.render ? column.render(row, index) : row[column.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>
      </table>
      {!loading && rows.length === 0 ? empty : null}
      {footer}
    </div>
  );
}

export function TableSkeleton({ rows = 5, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20, ...style }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ height: 16, width: `${92 - index * 7}%`, ...SKELETON }} />
      ))}
    </div>
  );
}

export function TableActions({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>{children}</div>;
}

export function IconButton({ icon, label, onClick, tone = 'neutral', disabled = false }) {
  const [hovered, setHovered] = useState(false);
  const palette = {
    neutral: { color: colors.muted, hoverBg: colors.cream, hoverColor: colors.ink },
    gold: { color: colors.goldDeep, hoverBg: colors.champagne, hoverColor: colors.goldDeep },
    danger: { color: colors.danger, hoverBg: colors.dangerBg, hoverColor: colors.danger },
  }[tone] || { color: colors.muted, hoverBg: colors.cream, hoverColor: colors.ink };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30,
        height: 30,
        display: 'grid',
        placeItems: 'center',
        border: `1px solid ${colors.border}`,
        background: hovered ? palette.hoverBg : colors.surface,
        color: hovered ? palette.hoverColor : palette.color,
        borderRadius: radii.sm,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .14s ease',
      }}
    >
      <Icon name={icon} size={14} />
    </button>
  );
}
