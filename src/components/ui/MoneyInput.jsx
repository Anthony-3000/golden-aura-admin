import { useEffect, useState } from 'react';
import { colors, fieldBase, focusRing, fonts } from '../../lib/theme.js';
import { paiseToRupees, rupeesToPaise } from '../../lib/format.js';

/**
 * Money is stored everywhere as integer paise but edited as rupees.
 */
export default function MoneyInput({
  valuePaise,
  onChangePaise,
  placeholder = '0.00',
  disabled = false,
  style,
  id,
  invalid = false,
}) {
  const [text, setText] = useState(() => paiseToRupees(valuePaise));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const external = paiseToRupees(valuePaise);
    if (Number.parseFloat(text || '0') !== Number.parseFloat(external || '0')) setText(external);
  }, [valuePaise]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span
        style={{
          position: 'absolute',
          left: 13,
          top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? colors.goldDeep : colors.muted,
          fontFamily: fonts.body,
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        ₹
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.]/g, '');
          setText(next);
          onChangePaise?.(rupeesToPaise(next));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const normalized = paiseToRupees(rupeesToPaise(text));
          setText(normalized);
        }}
        style={{
          ...fieldBase,
          paddingLeft: 29,
          textAlign: 'left',
          opacity: disabled ? 0.6 : 1,
          ...(focused ? focusRing : null),
          ...(invalid ? { borderColor: colors.danger } : null),
          ...style,
        }}
      />
    </div>
  );
}
