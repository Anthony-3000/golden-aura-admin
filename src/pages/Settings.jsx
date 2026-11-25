import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, radii } from '../lib/theme.js';
import { api, session } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { Divider, KeyValue, PageShell, SectionTitle } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

function byteLength(value) {
  try {
    return new TextEncoder().encode(value).length;
  } catch {
    return value.length;
  }
}

export default function Settings() {
  const { admin, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const [health, setHealth] = useState({ state: 'checking', label: 'Checking', detail: '', checkedAt: null });
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    document.title = 'Settings · Golden Aura Admin';
  }, []);

  const checkHealth = async () => {
    setHealth({ state: 'checking', label: 'Checking', detail: 'Contacting the API…', checkedAt: null });
    const [healthResult, readinessResult] = await Promise.allSettled([api.health(), api.readiness()]);

    if (healthResult.status === 'fulfilled') {
      const data = healthResult.value?.data;
      setHealth({
        state: 'online',
        label: 'Online',
        detail:
          (data && typeof data === 'object' && (data.status || data.message)) ||
          healthResult.value?.message ||
          'The API responded successfully.',
        checkedAt: new Date(),
      });
    } else {
      setHealth({
        state: 'offline',
        label: 'Offline',
        detail: healthResult.reason?.message || 'The API could not be reached.',
        checkedAt: new Date(),
      });
    }

    setReadiness(
      readinessResult.status === 'fulfilled'
        ? {
            ok: true,
            detail:
              (readinessResult.value?.data && typeof readinessResult.value.data === 'object'
                ? readinessResult.value.data.status || readinessResult.value.data.message
                : null) || 'Dependencies reported ready.',
          }
        : {
            ok: false,
            detail: readinessResult.reason?.message || 'Readiness check failed.',
          },
    );
  };

  useEffect(() => {
    checkHealth();
    // Health is checked once when the page opens; the server can be re-checked on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPassword = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!currentPassword) return setFormError('Enter your current password.');
    if (newPassword.length < 12) return setFormError('The new password must be at least 12 characters.');
    if (byteLength(newPassword) > 72) return setFormError('The new password must not exceed 72 UTF-8 bytes.');
    if (newPassword !== confirmPassword) return setFormError('The new password and confirmation do not match.');
    if (newPassword === currentPassword) return setFormError('Choose a password different from the current one.');

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Your password has changed. Sign in again with the new password.', 'Password updated');
      navigate('/login', { replace: true });
    } catch (passwordError) {
      setFormError(passwordError.message);
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const passwordType = showPasswords ? 'text' : 'password';
  const expiresAt = session.getExpiresAt();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="The house has a single administrator. Manage the password, review the session and confirm the backend connection."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, 0.8fr)',
          gap: 18,
          alignItems: 'start',
        }}
        className="ga-settings-grid"
      >
        <style>{'@media (max-width: 1000px){ .ga-settings-grid { grid-template-columns: 1fr !important; } }'}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Administrator" subtitle="The safe profile fields returned by the backend.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: colors.champagne,
                    border: '1px solid #EBD9B8',
                    color: colors.goldDeep,
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: fonts.display,
                    fontSize: 22,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {(admin?.name || 'GA')
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: fonts.display, fontSize: 25, fontWeight: 600, color: colors.ink }}>
                    {admin?.name || 'Golden Aura Admin'}
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.muted }}>{admin?.email || 'No email on record'}</div>
                </div>
                <Badge tone="gold" style={{ marginLeft: 'auto' }}>Single admin</Badge>
              </div>
              <Divider />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
                <KeyValue label="Admin ID" value={admin?.id || admin?._id || '—'} mono />
                <KeyValue label="Last sign-in" value={formatDateTime(admin?.lastLoginAt)} />
                <KeyValue label="Password changed" value={formatDateTime(admin?.passwordChangedAt)} />
              </div>
              <div style={{ fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
                There is no registration, forgot-password or second administrator account. A forgotten password is reset
                through a secure server-side script.
              </div>
            </div>
          </Panel>

          <Panel
            title="Change password"
            subtitle="Changing the password revokes the current session, so you will sign in again."
          >
            <form onSubmit={submitPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError ? <Alert tone="error" title="Password not changed">{formError}</Alert> : null}

              <Field label="Current password" required>
                <Input
                  type={passwordType}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Your current password"
                />
              </Field>

              <Field
                label="New password"
                required
                hint="At least 12 characters, up to 72 UTF-8 bytes. Use a long, unique passphrase."
              >
                <Input
                  type={passwordType}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="A long, memorable passphrase"
                />
              </Field>

              <Field label="Confirm new password" required>
                <Input
                  type={passwordType}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat the new password"
                />
              </Field>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <Toggle
                  checked={showPasswords}
                  onChange={setShowPasswords}
                  size="sm"
                  label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                />
                <span style={{ fontSize: 10.5, color: colors.faint }}>
                  {byteLength(newPassword)} / 72 bytes
                </span>
              </div>

              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                <Button type="submit" icon="lock" loading={saving}>
                  Change password
                </Button>
                <Button
                  variant="ghost"
                  disabled={saving}
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setFormError('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Panel>

          <Panel title="Version 1 scope" subtitle="What the admin deliberately does not do.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                ['No inventory', 'Products are Available or Unavailable. No stock counts, reservations or variants.'],
                ['COD only', 'No online payment gateway. Collection is recorded separately by the admin.'],
                ['No customer login', 'Customers are matched by normalized mobile at checkout.'],
                ['No analytics or CSV', 'Operational queues and lists only. No exports in this version.'],
                ['No customer cancellation', 'Only the admin can cancel, with a recorded reason.'],
                ['No tax documents', 'Invoices are operational. GST and statutory numbering are out of scope.'],
              ].map(([title, body]) => (
                <div
                  key={title}
                  style={{
                    padding: '12px 13px',
                    background: colors.bgAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.md,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 10.5, lineHeight: 1.6, color: colors.muted }}>{body}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel
            title="Backend connection"
            subtitle="The admin talks to the documented API base URL."
            action={
              <Button size="sm" variant="ghost" icon="refresh" onClick={checkHealth} loading={health.state === 'checking'}>
                Check
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.faint, marginBottom: 5 }}>
                  API base URL
                </div>
                <div
                  style={{
                    padding: '9px 11px',
                    background: colors.bgAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.sm,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 11,
                    color: colors.inkSoft,
                    wordBreak: 'break-all',
                  }}
                >
                  {api.baseUrl}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: colors.faint, lineHeight: 1.5 }}>
                  Set <span style={{ fontFamily: 'ui-monospace, monospace' }}>VITE_API_BASE_URL</span> at build time to
                  point at a deployment.
                </div>
              </div>

              <Divider />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>Health</div>
                  <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
                    GET /health · {health.checkedAt ? formatDateTime(health.checkedAt) : 'not checked'}
                  </div>
                </div>
                <Badge
                  tone={health.state === 'online' ? 'success' : health.state === 'offline' ? 'danger' : 'neutral'}
                >
                  {health.label}
                </Badge>
              </div>
              <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.6 }}>{health.detail}</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>Readiness</div>
                  <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>GET /health/ready</div>
                </div>
                <Badge tone={readiness?.ok ? 'success' : readiness ? 'danger' : 'neutral'}>
                  {readiness ? (readiness.ok ? 'Ready' : 'Not ready') : 'Unknown'}
                </Badge>
              </div>
              {readiness ? (
                <div style={{ fontSize: 11, color: colors.muted, lineHeight: 1.6 }}>{readiness.detail}</div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Session" subtitle="Credentials live in session storage and expire automatically.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon name="lock" size={15} style={{ color: colors.gold }} />
                <span style={{ fontSize: 12, color: colors.inkSoft }}>Signed in as {admin?.email || 'administrator'}</span>
              </div>
              <KeyValue
                label="Session expires"
                value={expiresAt ? formatDateTime(expiresAt) : 'On browser session end'}
              />
              <KeyValue label="Storage" value="sessionStorage · cleared when the tab closes" />
              <Button variant="secondary" icon="logout" loading={signingOut} onClick={signOut} fullWidth>
                Sign out
              </Button>
            </div>
          </Panel>

          <Panel bare>
            <div style={{ padding: 20, background: `radial-gradient(120% 120% at 0% 0%, #2E2319, ${colors.sidebar})` }}>
              <SectionTitle style={{ color: '#F5EBDC' }}>A note on the backend</SectionTitle>
              <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.7, color: '#B7A691' }}>
                Administrative modules beyond authentication may still be under construction. Screens are wired to the
                documented endpoints, so unavailable modules will report their status honestly rather than showing
                invented data.
              </p>
              <div style={{ marginTop: 14 }}>
                <Badge tone="dark">Golden Aura · Admin Atelier</Badge>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
