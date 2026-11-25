import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { colors, fieldBase, focusRing, fonts, radii } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Emblem, Wordmark } from '../components/Brand.jsx';
import Icon from '../components/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import useMediaQuery from '../hooks/useMediaQuery.js';

export default function Login() {
  const { login, isAuthenticated, checking } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNarrow = useMediaQuery('(max-width: 880px)');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');

  useEffect(() => {
    document.title = 'Sign in · Golden Aura Admin';
  }, []);

  if (!checking && isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter both your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: colors.bg }}>
      {!isNarrow ? <BrandPanel /> : null}

      <div
        style={{
          flex: '1 1 480px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isNarrow ? '36px 20px' : '48px 48px',
          position: 'relative',
        }}
      >
        {isNarrow ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 34 }}>
            <Emblem size={34} />
            <Wordmark size={15} />
          </div>
        ) : null}

        <div style={{ width: '100%', maxWidth: 384, animation: 'ga-fade-up .35s ease both' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: 2.2,
              textTransform: 'uppercase',
              color: colors.gold,
              marginBottom: 12,
            }}
          >
            <span style={{ width: 20, height: 1, background: colors.gold }} />
            Restricted access
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: fonts.display,
              fontSize: 46,
              fontWeight: 600,
              letterSpacing: -0.6,
              lineHeight: 1,
              color: colors.ink,
            }}
          >
            Welcome back
          </h1>
          <p style={{ margin: '12px 0 30px', fontSize: 13, lineHeight: 1.7, color: colors.muted }}>
            Sign in to steward the catalogue, orders and the Golden Aura house.
          </p>

          {error ? (
            <Alert tone="error" title="Sign-in failed" style={{ marginBottom: 18 }}>
              {error}
            </Alert>
          ) : null}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={labelStyle}>Email address</span>
              <span style={{ position: 'relative' }}>
                <span style={iconStyle}>
                  <Icon name="mail" size={15} />
                </span>
                <input
                  type="email"
                  value={email}
                  autoComplete="username"
                  autoFocus
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  placeholder="admin@example.com"
                  style={{
                    ...fieldBase,
                    paddingLeft: 38,
                    height: 46,
                    ...(focused === 'email' ? focusRing : null),
                  }}
                />
              </span>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={labelStyle}>Password</span>
              <span style={{ position: 'relative' }}>
                <span style={iconStyle}>
                  <Icon name="lock" size={15} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="Your password"
                  style={{
                    ...fieldBase,
                    paddingLeft: 38,
                    paddingRight: 42,
                    height: 46,
                    ...(focused === 'password' ? focusRing : null),
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((show) => !show)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 0,
                    background: 'transparent',
                    color: colors.faint,
                    padding: 2,
                  }}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </span>
            </label>

            <Button type="submit" size="lg" loading={submitting} fullWidth style={{ marginTop: 6 }}>
              Enter the atelier
            </Button>
          </form>

          <div
            style={{
              marginTop: 26,
              padding: '13px 14px',
              border: `1px solid ${colors.border}`,
              background: 'rgba(255,255,255,.55)',
              borderRadius: radii.md,
              display: 'flex',
              gap: 10,
              fontSize: 11,
              lineHeight: 1.6,
              color: colors.muted,
            }}
          >
            <Icon name="lock" size={14} style={{ marginTop: 1, color: colors.goldDeep }} />
            <span>
              There is no public registration or forgot-password flow. The developer resets credentials with the secure
              server-side script.
            </span>
          </div>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              fontSize: 9.5,
              letterSpacing: 1,
              color: colors.faint,
              textTransform: 'uppercase',
            }}
          >
            <span>Golden Aura · Admin Atelier</span>
            <span title={api.baseUrl} style={{ textTransform: 'none', letterSpacing: 0.2 }}>
              {api.baseUrl.replace(/^https?:\/\//, '')}
            </span>
          </div>
        </div>

        <Link
          to="/"
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: 'absolute', inset: 0, zIndex: -1 }}
        />
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      style={{
        flex: '1.08 1 560px',
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 15% 0%, #37291D 0%, ${colors.sidebar} 48%, #130E0A 100%)`,
        color: colors.sidebarText,
        padding: '46px 52px 42px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 640,
          height: 640,
          borderRadius: '50%',
          border: '1px solid rgba(212,168,75,.14)',
          top: '50%',
          left: '58%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 470,
          height: 470,
          borderRadius: '50%',
          border: '1px solid rgba(212,168,75,.1)',
          top: '50%',
          left: '58%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: '1px solid rgba(212,168,75,.16)',
          top: '50%',
          left: '58%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 13, position: 'relative' }}>
        <Emblem size={38} color={colors.goldLight} />
        <Wordmark tone="light" size={16} />
      </div>

      <div style={{ position: 'relative', maxWidth: 500, paddingBottom: 30 }}>
        <Emblem size={112} color={colors.goldLight} strokeWidth={0.7} style={{ marginBottom: 34, opacity: 0.95 }} />
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: colors.goldLight,
            marginBottom: 14,
          }}
        >
          The house behind the aura
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: fonts.display,
            fontSize: 'clamp(40px, 4vw, 58px)',
            fontWeight: 500,
            lineHeight: 1.02,
            letterSpacing: -0.8,
            color: '#F7EEDF',
          }}
        >
          Stewardship of a
          <br />
          <em style={{ color: colors.goldLight, fontWeight: 400 }}>golden house.</em>
        </h2>
        <p
          style={{
            margin: '20px 0 0',
            maxWidth: 410,
            fontSize: 13,
            lineHeight: 1.8,
            color: '#B7A691',
          }}
        >
          Curate the catalogue, choreograph the Aura Collections and care for every order — all from one quiet,
          considered place.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 34 }}>
          {['Catalogue', 'Orders', 'Customers', 'Delivery'].map((item) => (
            <span
              key={item}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 10,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: '#C9B7A1',
              }}
            >
              <span style={{ width: 4, height: 4, background: colors.gold, transform: 'rotate(45deg)' }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(212,168,75,.18)',
          paddingTop: 18,
          fontSize: 9,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: '#7A6957',
        }}
      >
        <span>Version 1 · Single administrator</span>
        <span>Cash on delivery</span>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 1.3,
  textTransform: 'uppercase',
  color: colors.muted,
  fontFamily: fonts.body,
};

const iconStyle = {
  position: 'absolute',
  left: 13,
  top: '50%',
  transform: 'translateY(-50%)',
  color: colors.faint,
  pointerEvents: 'none',
  zIndex: 1,
};
