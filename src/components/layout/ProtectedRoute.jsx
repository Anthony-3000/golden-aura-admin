import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Emblem } from '../Brand.jsx';
import Spinner from '../ui/Spinner.jsx';
import { colors, fonts } from '../../lib/theme.js';

export default function ProtectedRoute() {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: colors.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <Emblem size={54} />
        <Spinner size={22} />
        <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, fontFamily: fonts.body }}>
          Verifying session
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
