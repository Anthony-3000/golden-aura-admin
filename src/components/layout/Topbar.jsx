import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { colors, fonts, layout, radii, shadows } from '../../lib/theme.js';
import { NAV_SECTIONS } from '../../lib/constants.js';
import { titleCase } from '../../lib/format.js';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Icon from '../Icon.jsx';

const FLAT_NAV = NAV_SECTIONS.flatMap((section) => section.items);

export default function Topbar({ onMenu, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [health, setHealth] = useState('checking');
  const menuRef = useRef(null);

  const active = [...FLAT_NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`)));

  const sectionLabel = active?.label || 'Dashboard';
  const segments = location.pathname.split('/').filter(Boolean);
  const detailLabel = segments.length > 1 ? titleCase(segments[segments.length - 1]) : null;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let activeRequest = true;
    const check = () => {
      api
        .readiness()
        .then(() => activeRequest && setHealth('online'))
        .catch(() => activeRequest && setHealth('offline'));
    };
    check();
    const timer = window.setInterval(check, 60000);
    return () => {
      activeRequest = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const initials = (admin?.name || 'GA')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const healthPalette =
    health === 'online'
      ? { dot: colors.success, label: 'API online' }
      : health === 'offline'
        ? { dot: colors.danger, label: 'API offline' }
        : { dot: colors.faint, label: 'Checking API' };

  return (
    <header
      style={{
        height: layout.topbarHeight,
        position: 'sticky',
        top: 0,
        zIndex: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: isMobile ? '0 16px' : '0 28px',
        background: 'rgba(251, 248, 243, 0.88)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {isMobile ? (
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open navigation"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.inkSoft,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="menu" size={16} />
          </button>
        ) : null}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: colors.faint,
              marginBottom: 2,
            }}
          >
            Golden Aura · Admin
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Link
              to={active?.to || '/'}
              style={{
                textDecoration: 'none',
                fontFamily: fonts.display,
                fontSize: 18,
                fontWeight: 600,
                color: colors.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {sectionLabel}
            </Link>
            {detailLabel ? (
              <>
                <Icon name="chevronRight" size={13} style={{ color: colors.faint }} />
                <span
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {detailLabel}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
        <div
          title={`${healthPalette.label} · ${api.baseUrl}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 9px',
            borderRadius: radii.pill,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            fontSize: 9.5,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: colors.muted,
            fontWeight: 500,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: healthPalette.dot }} />
          {!isMobile ? healthPalette.label : null}
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              border: `1px solid ${menuOpen ? colors.borderStrong : 'transparent'}`,
              background: menuOpen ? colors.surface : 'transparent',
              borderRadius: radii.pill,
              padding: '4px 6px 4px 4px',
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.goldLight}, ${colors.goldDeep})`,
                color: '#241A12',
                display: 'grid',
                placeItems: 'center',
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 12.5,
              }}
            >
              {initials}
            </span>
            {!isMobile ? (
              <span style={{ textAlign: 'left', lineHeight: 1.25, paddingRight: 4 }}>
                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: colors.ink }}>
                  {admin?.name || 'Administrator'}
                </span>
                <span style={{ display: 'block', fontSize: 9, color: colors.faint, letterSpacing: 0.4 }}>
                  {admin?.email || 'Admin'}
                </span>
              </span>
            ) : null}
            <Icon name="chevronDown" size={13} style={{ color: colors.faint, marginRight: 2 }} />
          </button>

          {menuOpen ? (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 224,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
                boxShadow: shadows.raised,
                overflow: 'hidden',
                animation: 'ga-fade-up .16s ease both',
              }}
            >
              <div style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>{admin?.name || 'Administrator'}</div>
                <div style={{ fontSize: 10.5, color: colors.muted, marginTop: 2, wordBreak: 'break-all' }}>
                  {admin?.email || 'Single admin account'}
                </div>
              </div>
              <div style={{ padding: 6 }}>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  style={menuItemStyle}
                >
                  <Icon name="user" size={14} />
                  Account & password
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  style={menuItemStyle}
                >
                  <Icon name="settings" size={14} />
                  Settings
                </button>
              </div>
              <div style={{ padding: 6, borderTop: `1px solid ${colors.border}` }}>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    navigate('/login', { replace: true });
                  }}
                  style={{ ...menuItemStyle, color: colors.danger }}
                >
                  <Icon name="logout" size={14} />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  border: 0,
  background: 'transparent',
  padding: '9px 10px',
  borderRadius: 7,
  color: colors.inkSoft,
  fontFamily: fonts.body,
  fontSize: 12,
  textAlign: 'left',
};
