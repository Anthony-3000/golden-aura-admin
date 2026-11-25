import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, session } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => session.getAdmin());
  const [checking, setChecking] = useState(() => Boolean(session.getToken()));
  const expiryTimer = useRef(null);

  const clearTimer = useCallback(() => {
    if (expiryTimer.current) {
      window.clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  const clearSession = useCallback(() => {
    clearTimer();
    session.clear();
    setAdmin(null);
  }, [clearTimer]);

  const scheduleExpiry = useCallback(
    (expiresAt) => {
      clearTimer();
      const remaining = Number(expiresAt) - Date.now();
      if (remaining <= 0) {
        clearSession();
        return;
      }
      expiryTimer.current = window.setTimeout(clearSession, remaining);
    },
    [clearSession, clearTimer],
  );

  useEffect(() => {
    const storedExpiry = session.getExpiresAt();
    if (storedExpiry && storedExpiry <= Date.now()) {
      clearSession();
      setChecking(false);
      return;
    }

    if (!session.getToken()) {
      setChecking(false);
      return;
    }

    let active = true;
    api.auth
      .me()
      .then(({ data }) => {
        if (!active) return;
        setAdmin(data.admin);
        scheduleExpiry(storedExpiry);
      })
      .catch(() => {
        if (!active) return;
        clearSession();
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession, scheduleExpiry]);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener('ga:unauthorized', onUnauthorized);
    return () => {
      window.removeEventListener('ga:unauthorized', onUnauthorized);
      clearTimer();
    };
  }, [clearSession, clearTimer]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.auth.login(email, password);
      session.setSession({ token: data.accessToken, admin: data.admin, expiresIn: data.expiresIn });
      setAdmin(data.admin);
      scheduleExpiry(Date.now() + (Number(data.expiresIn) || 3600) * 1000);
      return data.admin;
    },
    [scheduleExpiry],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Revoking the token is best effort; local credentials are cleared regardless.
    }
    clearSession();
  }, [clearSession]);

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      await api.auth.changePassword(currentPassword, newPassword);
      clearSession();
    },
    [clearSession],
  );

  const value = useMemo(
    () => ({ admin, checking, isAuthenticated: Boolean(admin), login, logout, changePassword }),
    [admin, checking, login, logout, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
