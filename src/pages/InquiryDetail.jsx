import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fonts, radii } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDateTime, initials } from '../lib/format.js';
import { INQUIRY_STATUSES } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import { Field, Select, Textarea } from '../components/ui/Field.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { Divider, KeyValue, PageShell, SectionTitle } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

const TIMELINE_TONE = {
  New: colors.warning,
  Contacted: colors.info,
  Resolved: colors.success,
  Rejected: colors.danger,
};

function Timeline({ history = [] }) {
  if (!history.length) {
    return <span style={{ fontSize: 12.5, color: colors.faint }}>No status history recorded yet.</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[...history].map((entry, index) => {
        const tone = TIMELINE_TONE[entry.status] || colors.muted;
        return (
          <div key={`${entry.status}-${index}`} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12, flexShrink: 0 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: tone,
                  marginTop: 5,
                  boxShadow: `0 0 0 3px ${colors.surface}`,
                }}
              />
              {index < history.length - 1 ? (
                <span style={{ width: 1, flex: 1, background: colors.border, minHeight: 24 }} />
              ) : null}
            </div>
            <div style={{ paddingBottom: index < history.length - 1 ? 15 : 0, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <StatusBadge status={entry.status} />
                <span style={{ fontSize: 10.5, color: colors.faint }}>{formatDateTime(entry.changedAt)}</span>
              </div>
              {entry.note ? (
                <p style={{ margin: '5px 0 0', fontSize: 12, lineHeight: 1.6, color: colors.inkSoft }}>{entry.note}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusValue, setStatusValue] = useState('New');
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [quickBusy, setQuickBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api.inquiries
      .get(id)
      .then((response) => {
        const data = response.data?.inquiry || response.data;
        setInquiry(data);
        setStatusValue(data?.status || 'New');
        setError(null);
      })
      .catch((loadError) => setError(loadError))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    document.title = inquiry?.name ? `${inquiry.name} · Inquiries` : 'Inquiry · Golden Aura Admin';
  }, [inquiry]);

  const inquiryId = inquiry?.id || inquiry?._id || id;
  const history = Array.isArray(inquiry?.statusHistory) ? inquiry.statusHistory : [];
  const notes = Array.isArray(inquiry?.adminNotes) ? inquiry.adminNotes : [];

  const applyStatus = async (nextStatus, noteText) => {
    setStatusError('');
    if (nextStatus === inquiry?.status && !String(noteText || '').trim()) {
      setStatusError('Choose a different status, or add a note to record this interaction.');
      return;
    }
    setSavingStatus(true);
    try {
      await api.inquiries.setStatus(inquiryId, nextStatus, String(noteText || '').trim() || undefined);
      toast.success(`Inquiry marked ${nextStatus}.`);
      setStatusNote('');
      load();
    } catch (statusFailure) {
      setStatusError(statusFailure.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const submitStatus = (event) => {
    event.preventDefault();
    applyStatus(statusValue, statusNote);
  };

  const quickStatus = async (nextStatus) => {
    setQuickBusy(true);
    try {
      await api.inquiries.setStatus(inquiryId, nextStatus);
      toast.success(`Inquiry marked ${nextStatus}.`);
      load();
    } catch (quickError) {
      toast.error(quickError.message);
    } finally {
      setQuickBusy(false);
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await api.inquiries.addNote(inquiryId, note.trim());
      toast.success('Internal note added.');
      setNote('');
      load();
    } catch (noteError) {
      toast.error(noteError.message);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading && !inquiry) return <PageLoader label="Opening the inquiry…" />;

  if (error && !inquiry) {
    return (
      <PageShell>
        <PageHeader eyebrow="Inquiry" title="Inquiry detail" />
        <Alert
          tone="error"
          title="This inquiry could not be loaded"
          action={
            <Button size="sm" variant="secondary" icon="arrowLeft" onClick={() => navigate('/inquiries')}>
              Back to inquiries
            </Button>
          }
        >
          {error.message}
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Inquiry"
        title={inquiry?.name || 'Customer inquiry'}
        subtitle={`Received ${formatDateTime(inquiry?.createdAt)}`}
        actions={
          <>
            <Button variant="secondary" icon="arrowLeft" onClick={() => navigate('/inquiries')}>
              Back
            </Button>
            {inquiry?.status !== 'Contacted' ? (
              <Button
                variant="secondary"
                icon="phone"
                loading={quickBusy}
                onClick={() => quickStatus('Contacted')}
              >
                Mark contacted
              </Button>
            ) : null}
            {inquiry?.status !== 'Resolved' ? (
              <Button icon="check" loading={quickBusy} onClick={() => quickStatus('Resolved')}>
                Mark resolved
              </Button>
            ) : null}
          </>
        }
      />

      {error ? <Alert tone="error" style={{ marginBottom: 16 }}>{error.message}</Alert> : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 18,
          padding: '13px 16px',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radii.md,
        }}
      >
        <StatusBadge status={inquiry?.status} />
        <Badge tone="neutral" dot={false}>{inquiry?.mobile || inquiry?.normalizedMobile || 'No mobile'}</Badge>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: colors.faint, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={13} />
          {formatDateTime(inquiry?.createdAt)}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(290px, 0.8fr)',
          gap: 18,
          alignItems: 'start',
        }}
        className="ga-inquiry-grid"
      >
        <style>{'@media (max-width: 1000px){ .ga-inquiry-grid { grid-template-columns: 1fr !important; } }'}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Message" subtitle="Submitted through the public inquiry form. No attachments or subject line.">
            <div
              style={{
                padding: '20px 22px',
                background: colors.bgAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
                borderLeft: `3px solid ${colors.gold}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.display,
                  fontSize: 21,
                  lineHeight: 1.65,
                  color: colors.inkSoft,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {inquiry?.message || 'No message captured.'}
              </p>
            </div>
          </Panel>

          <Panel title="Internal notes" subtitle="Admin-only context. Never shown on the storefront.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form onSubmit={addNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Customer is interested in a bridal set…"
                  maxLength={1000}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" size="sm" icon="plus" loading={savingNote} disabled={!note.trim()}>
                    Add note
                  </Button>
                </div>
              </form>

              {notes.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[...notes].reverse().map((entry, index) => (
                    <div
                      key={entry.id || entry._id || index}
                      style={{
                        padding: '11px 13px',
                        background: colors.bgAlt,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radii.md,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: colors.inkSoft }}>{entry.note}</p>
                      <div style={{ marginTop: 5, fontSize: 10, color: colors.faint }}>
                        {formatDateTime(entry.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 12, color: colors.faint }}>No internal notes yet.</span>
              )}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Contact">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: colors.champagne,
                    border: '1px solid #EBD9B8',
                    color: colors.goldDeep,
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: fonts.display,
                    fontSize: 18,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initials(inquiry?.name)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: fonts.display, fontSize: 21, fontWeight: 600, color: colors.ink }}>
                    {inquiry?.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: colors.faint }}>
                    {inquiry?.normalizedMobile || inquiry?.mobile}
                  </div>
                </div>
              </div>
              <Divider />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href={`tel:${inquiry?.mobile || inquiry?.normalizedMobile || ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    fontSize: 12.5,
                    color: colors.inkSoft,
                    textDecoration: 'none',
                  }}
                >
                  <Icon name="phone" size={14} style={{ color: colors.gold }} />
                  {inquiry?.mobile || 'No mobile'}
                </a>
                <a
                  href={`mailto:${inquiry?.email || ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    fontSize: 12.5,
                    color: colors.inkSoft,
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                  }}
                >
                  <Icon name="mail" size={14} style={{ color: colors.gold }} />
                  {inquiry?.email || 'No email'}
                </a>
              </div>
            </div>
          </Panel>

          <Panel title="Update status" subtitle="Every change is appended to the status history.">
            <form onSubmit={submitStatus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {statusError ? <Alert tone="error">{statusError}</Alert> : null}
              <Field label="Status">
                <Select value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
                  {INQUIRY_STATUSES.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Note" hint="Optional. Included with this status change.">
                <Textarea
                  rows={3}
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Called the customer and shared the bridal catalogue…"
                  maxLength={500}
                />
              </Field>
              <Button type="submit" icon="check" loading={savingStatus} fullWidth>
                Save status
              </Button>
              {inquiry?.status !== 'Rejected' ? (
                <Button
                  variant="dangerGhost"
                  size="sm"
                  icon="close"
                  fullWidth
                  disabled={savingStatus}
                  onClick={() => applyStatus('Rejected', statusNote)}
                >
                  Reject inquiry
                </Button>
              ) : null}
            </form>
          </Panel>

          <Panel title="Status history">
            <Timeline history={history} />
          </Panel>

          <Panel title="Record">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <KeyValue label="Inquiry ID" value={inquiryId} mono />
              <KeyValue label="Received" value={formatDateTime(inquiry?.createdAt)} />
              <KeyValue label="Last updated" value={formatDateTime(inquiry?.updatedAt)} />
            </div>
          </Panel>

          <Panel bare>
            <div style={{ padding: 20, background: colors.champagne, borderTop: `1px solid #EBD9B8` }}>
              <SectionTitle note="Admin only">A quiet note</SectionTitle>
              <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.7, color: colors.inkSoft }}>
                Version 1 sends no autoresponder and no notification email. Respond personally, then record the outcome
                here so the next person understands the conversation.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
