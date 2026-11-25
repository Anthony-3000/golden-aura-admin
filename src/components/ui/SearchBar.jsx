import { useState } from 'react';
import { colors, fieldBase, focusRing, fonts, radii } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  onSubmit,
  style,
  autoFocus = false,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 190, ...style }}>
      <span
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? colors.gold : colors.faint,
          pointerEvents: 'none',
        }}
      >
        <Icon name="search" size={15} />
      </span>
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit?.();
          if (event.key === 'Escape') onChange?.('');
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...fieldBase,
          paddingLeft: 36,
          paddingRight: value ? 34 : 12,
          ...(focused ? focusRing : null),
        }}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange?.('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            border: 0,
            background: colors.cream,
            color: colors.muted,
            borderRadius: radii.pill,
            width: 20,
            height: 20,
            display: 'grid',
            placeItems: 'center',
            fontFamily: fonts.body,
          }}
        >
          <Icon name="close" size={11} />
        </button>
      ) : null}
    </div>
  );
}
