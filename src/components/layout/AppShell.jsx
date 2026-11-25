import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { colors, layout } from '../../lib/theme.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useMediaQuery from '../../hooks/useMediaQuery.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppShell() {
  const isMobile = useMediaQuery('(max-width: 980px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(90% 60% at 100% 0%, #F7F1E7 0%, ${colors.bg} 55%)`,
      }}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={isMobile ? () => setSidebarOpen(false) : undefined}
        admin={admin}
        onLogout={handleLogout}
      />
      <div
        style={{
          marginLeft: isMobile ? 0 : layout.sidebarWidth,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar onMenu={() => setSidebarOpen(true)} isMobile={isMobile} />
        <main
          style={{
            flex: 1,
            width: '100%',
            maxWidth: layout.contentMax + 72,
            margin: '0 auto',
            padding: isMobile ? '20px 16px 48px' : '30px 36px 60px',
          }}
        >
          <Outlet />
        </main>
        <footer
          style={{
            borderTop: `1px solid ${colors.border}`,
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 9.5,
            letterSpacing: 1.1,
            textTransform: 'uppercase',
            color: colors.faint,
          }}
        >
          <span>Golden Aura · Admin Atelier</span>
          <span>Version 1 · Single administrator</span>
        </footer>
      </div>
    </div>
  );
}
