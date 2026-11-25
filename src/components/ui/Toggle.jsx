import { colors, fonts } from '../../lib/theme.js';

export default function Toggle({ checked, onChange, disabled = false, label, size = 'md' }) {
  const width = size === 'sm' ? 34 : 42;
  const height = size === 'sm' ? 19 : 24;
  const knob = height - 6;

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontFamily: fonts.body,
        fontSize: 12.5,
        color: colors.inkSoft,
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        style={{
          width,
          height,
          borderRadius: 999,
          border: 0,
          padding: 2,
          background: checked ? colors.gold : colors.sand,
          position: 'relative',
          transition: 'background .18s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: knob,
            height: knob,
            borderRadius: '50%',
            background: '#FFFDF8',
            boxShadow: '0 1px 3px rgba(36,26,18,.22)',
            transform: `translateX(${checked ? width - knob - 4 : 0}px)`,
            transition: 'transform .18s ease',
          }}
        />
      </button>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
