import { NavLink } from 'react-router-dom';
import { colors, fonts, layout, radii } from '../../lib/theme.js';
import { NAV_SECTIONS } from '../../lib/constants.js';
import { Emblem, Wordmark } from '../Brand.jsx';
import Icon from '../Icon.jsx';

export default function Sidebar({ open = false, onClose, admin, onLogout }) {
  return (
    <>
      {open ? (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20,14,10,.45)',
            zIndex: 900,
            backdropFilter: 'blur(1px)',
          }}
        />
      ) : null}
      <aside
        style={{
          width: layout.sidebarWidth,
          position: 'fixed',
          inset: '0 auto 0 0',
          zIndex: 950,
          background: `radial-gradient(120% 60% at 15% 0%, #2A2018 0%, ${colors.sidebar} 58%, #17110D 100%)`,
          borderRight: `1px solid ${colors.sidebarLine}`,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .22s ease',
          boxShadow: open ? '20px 0 60px rgba(15,10,7,.3)' : 'none',
          overflowY: 'auto',
        }}
        className="ga-sidebar"
      >
        <style>
          {`
            .ga-sidebar::-webkit-scrollbar { width: 4px; }
            .ga-sidebar::-webkit-scrollbar-thumb { background: #4A392B; border-radius: 4px; }
            @media (min-width: 981px) {
              .ga-sidebar { transform: translateX(0) !important; box-shadow: none !important; }
            }
          `}
        </style>

        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Emblem size={34} color={colors.goldLight} />
          <Wordmark tone="light" size={15} />
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              style={{
                marginLeft: 'auto',
                border: `1px solid ${colors.sidebarLine}`,
                background: 'transparent',
                color: colors.sidebarMuted,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
              }}
              className="ga-sidebar-close"
            >
              <Icon name="close" size={13} />
            </button>
          ) : null}
        </div>

        <div
          style={{
            height: 1,
            margin: '0 20px 12px',
            background: `linear-gradient(90deg, ${colors.gold}55, transparent)`,
          }}
        />

        <nav style={{ flex: 1, padding: '0 12px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div
                style={{
                  padding: '0 10px 7px',
                  fontSize: 8.5,
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#7C6B59',
                  fontFamily: fonts.body,
                }}
              >
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 10px',
                      borderRadius: radii.sm,
                      textDecoration: 'none',
                      backgroundColor: isActive ? 'rgba(184,135,58,.15)' : 'transparent',
                      color: isActive ? '#F6EBD9' : colors.sidebarMuted,
                      fontFamily: fonts.body,
                      fontSize: 12.5,
                      fontWeight: isActive ? 500 : 400,
                      letterSpacing: 0.25,
                      transition: 'background .14s ease, color .14s ease',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <span
                            style={{
                              position: 'absolute',
                              left: -12,
                              top: 8,
                              bottom: 8,
                              width: 2,
                              borderRadius: 2,
                              background: colors.goldLight,
                            }}
                          />
                        ) : null}
                        <Icon name={item.icon} size={16} style={{ color: isActive ? colors.goldLight : '#8B7A66' }} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ padding: '14px 18px 20px', borderTop: `1px solid ${colors.sidebarLine}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.goldLight}, ${colors.goldDeep})`,
                color: '#241A12',
                display: 'grid',
                placeItems: 'center',
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {(admin?.name || 'GA')
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: colors.sidebarText,
                  fontSize: 11.5,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {admin?.name || 'Golden Aura Admin'}
              </div>
              <div style={{ color: '#7C6B59', fontSize: 9, letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 2 }}>
                Sole administrator
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              style={{
                border: `1px solid ${colors.sidebarLine}`,
                background: 'transparent',
                color: colors.sidebarMuted,
                width: 29,
                height: 29,
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="logout" size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
