import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { colors, fonts } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDateTime, initials, truncate } from '../lib/format.js';
import { INQUIRY_STATUSES } from '../lib/constants.js';
import usePaginatedList from '../hooks/usePaginatedList.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import { Input } from '../components/ui/Field.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import { PageShell } from '../components/ui/Media.jsx';

export default function Inquiries() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');

  const params = {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const { items, pagination, loading, error, reload } = usePaginatedList(api.inquiries.list, params);

  useEffect(() => {
    document.title = 'Inquiries · Golden Aura Admin';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, from, to]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const changeStatus = (value) => {
    setStatus(value);
    updateParam('status', value);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setFrom('');
    setTo('');
    setSearchParams({}, { replace: true });
  };

  const columns = [
    {
      key: 'customer',
      header: 'From',
      render: (inquiry) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: colors.champagne,
              color: colors.goldDeep,
              border: '1px solid #EBD9B8',
              display: 'grid',
              placeItems: 'center',
              fontFamily: fonts.display,
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials(inquiry.name)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>{inquiry.name || 'Customer'}</div>
            <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
              {inquiry.mobile || inquiry.normalizedMobile || 'No mobile'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (inquiry) => (
        <span
          style={{
            display: 'block',
            maxWidth: 220,
            fontSize: 11.5,
            color: colors.muted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {inquiry.email || '—'}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (inquiry) => (
        <span
          style={{
            display: 'block',
            maxWidth: 380,
            fontSize: 12,
            color: colors.inkSoft,
            lineHeight: 1.55,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {truncate(inquiry.message || '', 130)}
        </span>
      ),
    },
    {
      key: 'submitted',
      header: 'Received',
      render: (inquiry) => (
        <span style={{ fontSize: 11, color: colors.muted }}>{formatDateTime(inquiry.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inquiry) => <StatusBadge status={inquiry.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 60,
      render: (inquiry) => (
        <TableActions>
          <IconButton
            icon="eye"
            label="Open inquiry"
            onClick={() => navigate(`/inquiries/${inquiry.id || inquiry._id}`)}
          />
        </TableActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Engagement"
        title="Inquiries"
        subtitle="Messages from the storefront inquiry form. Name, mobile, email and message are captured without attachments."
        actions={
          <>
            <Badge tone="gold" dot={false}>{pagination.totalItems} in view</Badge>
            <Button variant="secondary" icon="refresh" onClick={reload} loading={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <Panel bare>
        <div style={{ padding: '14px 18px 0' }}>
          <Tabs
            value={status}
            onChange={changeStatus}
            items={[
              { value: '', label: 'All inquiries' },
              ...INQUIRY_STATUSES.map((value) => ({ value, label: value })),
            ]}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or mobile…"
            style={{ flex: '2 1 240px', maxWidth: 340 }}
          />
          <div style={{ flex: '0 1 160px', minWidth: 145 }}>
            <Input
              type="date"
              aria-label="Inquiries from date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                updateParam('from', event.target.value);
              }}
              style={{ fontSize: 12, padding: '9px 10px' }}
            />
          </div>
          <div style={{ flex: '0 1 160px', minWidth: 145 }}>
            <Input
              type="date"
              aria-label="Inquiries to date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                updateParam('to', event.target.value);
              }}
              style={{ fontSize: 12, padding: '9px 10px' }}
            />
          </div>
          {debouncedSearch || status || from || to ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          ) : null}
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Inquiries could not be loaded"
              action={<Button size="sm" variant="secondary" icon="refresh" onClick={reload}>Retry</Button>}
            >
              {error.message}
            </Alert>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          minWidth={920}
          rowKey={(inquiry) => inquiry.id || inquiry._id}
          onRowClick={(inquiry) => navigate(`/inquiries/${inquiry.id || inquiry._id}`)}
          empty={
            !loading ? (
              <EmptyState
                icon="inbox"
                title={debouncedSearch || status || from || to ? 'No inquiries match this view' : 'No inquiries yet'}
                description={
                  debouncedSearch || status || from || to
                    ? 'Try clearing the filters or switching status tabs.'
                    : 'New messages from the storefront inquiry form will arrive here.'
                }
                action={
                  debouncedSearch || status || from || to ? (
                    <Button size="sm" variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            ) : null
          }
          footer={<div style={{ padding: '0 16px' }}><Pagination {...pagination} onChange={setPage} /></div>}
        />
      </Panel>

      <div style={{ marginTop: 14, fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
        Inquiries have no customer login, no attachments and no subject line. Internal notes and status history stay
        admin-only.
      </div>
    </PageShell>
  );
}
