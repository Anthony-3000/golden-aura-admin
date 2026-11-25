import { Link } from 'react-router-dom';
import { colors, fonts } from '../lib/theme.js';
import { Emblem } from '../components/Brand.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <Emblem size={62} />
      <div style={{ marginTop: 26, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: colors.gold }}>
        404 · Not found
      </div>
      <h1
        style={{
          margin: '10px 0 8px',
          fontFamily: fonts.display,
          fontSize: 'clamp(34px, 6vw, 54px)',
          fontWeight: 600,
          color: colors.ink,
          lineHeight: 1.05,
        }}
      >
        This page slipped out of the vault.
      </h1>
      <p style={{ margin: '0 0 24px', maxWidth: 430, fontSize: 13, lineHeight: 1.7, color: colors.muted }}>
        The page you are looking for does not exist in the admin atelier. Return to the dashboard to continue.
      </p>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Button icon="arrowLeft">Back to dashboard</Button>
      </Link>
    </div>
  );
}
