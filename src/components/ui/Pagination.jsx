import { colors, fonts, radii } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

function pageWindow(current, total) {
  if (total <= 6) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('…');
    result.push(page);
  });
  return result;
}

export default function Pagination({ page = 1, totalPages = 1, totalItems, limit, onChange, style }) {
  if (!totalPages || totalPages <= 1) {
    return totalItems !== undefined ? (
      <div style={{ fontSize: 11.5, color: colors.faint, padding: '10px 2px', ...style }}>
        {totalItems} {totalItems === 1 ? 'record' : 'records'}
      </div>
    ) : null;
  }

  const buttonStyle = (active, disabled) => ({
    minWidth: 32,
    height: 32,
    padding: '0 9px',
    borderRadius: radii.sm,
    border: `1px solid ${active ? colors.gold : colors.border}`,
    background: active ? colors.champagne : colors.surface,
    color: active ? colors.goldDeep : disabled ? colors.faint : colors.inkSoft,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    display: 'grid',
    placeItems: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '12px 2px',
        ...style,
      }}
    >
      <span style={{ fontSize: 11.5, color: colors.faint }}>
        Page {page} of {totalPages}
        {totalItems !== undefined ? ` · ${totalItems} ${totalItems === 1 ? 'record' : 'records'}` : ''}
        {limit ? ` · ${limit} per page` : ''}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange?.(page - 1)}
          style={buttonStyle(false, page <= 1)}
        >
          <Icon name="chevronLeft" size={14} />
        </button>
        {pageWindow(page, totalPages).map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} style={{ padding: '0 3px', color: colors.faint, fontSize: 12 }}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange?.(item)}
              style={buttonStyle(item === page, false)}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onChange?.(page + 1)}
          style={buttonStyle(false, page >= totalPages)}
        >
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </div>
  );
}
