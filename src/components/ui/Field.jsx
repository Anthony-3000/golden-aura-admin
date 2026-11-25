import { useState } from 'react';
import { colors, fieldBase, focusRing, fonts } from '../../lib/theme.js';
import Icon from '../Icon.jsx';

const labelStyle = {
  display: 'block',
  fontFamily: fonts.body,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 1.25,
  textTransform: 'uppercase',
  color: colors.muted,
  marginBottom: 7,
};

export function Field({ label, hint, error, required, htmlFor, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {label ? (
        <label htmlFor={htmlFor} style={labelStyle}>
          {label}
          {required ? <span style={{ color: colors.danger }}> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <span style={{ marginTop: 6, fontSize: 11.5, color: colors.danger }}>{error}</span>
      ) : hint ? (
        <span style={{ marginTop: 6, fontSize: 11.5, color: colors.faint, lineHeight: 1.5 }}>{hint}</span>
      ) : null}
    </div>
  );
}

export function Input({ invalid = false, style, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={{
        ...fieldBase,
        ...(focused ? focusRing : null),
        ...(invalid ? { borderColor: colors.danger } : null),
        ...style,
      }}
      {...rest}
    />
  );
}

export function Textarea({ invalid = false, rows = 4, style, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      rows={rows}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={{
        ...fieldBase,
        resize: 'vertical',
        minHeight: 92,
        lineHeight: 1.6,
        ...(focused ? focusRing : null),
        ...(invalid ? { borderColor: colors.danger } : null),
        ...style,
      }}
      {...rest}
    />
  );
}

export function Select({ children, invalid = false, style, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={{
          ...fieldBase,
          appearance: 'none',
          WebkitAppearance: 'none',
          paddingRight: 36,
          cursor: 'pointer',
          ...(focused ? focusRing : null),
          ...(invalid ? { borderColor: colors.danger } : null),
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      <span
        style={{
          position: 'absolute',
          right: 13,
          top: '50%',
          transform: 'translateY(-50%)',
          color: colors.muted,
          pointerEvents: 'none',
        }}
      >
        <Icon name="chevronDown" size={15} />
      </span>
    </div>
  );
}

export function FormGrid({ children, columns = 2, style }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns > 1 ? 220 : 260}px, 1fr))`,
        gap: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
