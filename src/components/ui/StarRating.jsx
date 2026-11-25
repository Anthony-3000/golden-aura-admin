import Icon from '../Icon.jsx';
import { colors } from '../../lib/theme.js';

export default function StarRating({ rating = 0, size = 15, showValue = false, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      <span style={{ display: 'inline-flex', gap: 2, color: colors.gold }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{ opacity: star <= rating ? 1 : 0.22 }}>
            <Icon name="star" size={size} filled strokeWidth={0} />
          </span>
        ))}
      </span>
      {showValue ? (
        <span style={{ fontSize: 11.5, color: colors.muted, fontWeight: 500 }}>{Number(rating).toFixed(1)}</span>
      ) : null}
    </span>
  );
}
