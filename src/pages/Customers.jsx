import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { colors, fonts } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDateTime, formatINR, initials } from '../lib/format.js';
import usePaginatedList from '../hooks/usePaginatedList.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import { Select } from '../components/ui/Field.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import { PageShell } from '../components/ui/Media.jsx';

function customerValue(customer) {
  return (
    customer.totalOrderValuePaise ??
    customer.totalSpendPaise ??
    customer.totalSpendingPaise ??
    customer.orderValuePaise ??
    null
  );
}

function customerOrders(customer) {
  return customer.totalOrders ?? customer.orderCount ?? customer.ordersCount ?? null;
}

export default function Customers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [sort, setSort] = useState(searchParams.get('sort') || '');

  const params = {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(sort ? { sort } : {}),
  };

  const { items, pagination, loading, error, reload } = usePaginatedList(api.customers.list, params);

  useEffect(() => {
    document.title = 'Customers · Golden Aura Admin';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort]);

  const updateSort = (value) => {
    setSort(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('sort', value);
    else next.delete('sort');
    setSearchParams(next, { replace: true });
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (customer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: colors.champagne,
              color: colors.goldDeep,
              display: 'grid',
              placeItems: 'center',
              fontFamily: fonts.display,
              fontSize: 15,
              fontWeight: 600,
              flexShrink: 0,
              border: `1px solid #EBD9B8`,
            }}
          >
            {initials(customer.name)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: colors.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 260,
              }}
            >
              {customer.name || 'Customer'}
            </div>
            <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
              {customer.currentAddress?.city || customer.currentAddress?.state || 'No address on file'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (customer) => (
        <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.55 }}>
          <div>{customer.mobile || '—'}</div>
          <div style={{ fontSize: 10.5, color: colors.faint }}>{customer.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'center',
      width: 80,
      render: (customer) => {
        const count = customerOrders(customer);
        return (
          <span style={{ fontSize: 12.5, color: count ? colors.inkSoft : colors.faint }}>
            {count ?? '—'}
          </span>
        );
      },
    },
    {
      key: 'value',
      header: 'Lifetime value',
      align: 'right',
      render: (customer) => (
        <span style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>
          {customerValue(customer) !== null ? formatINR(customerValue(customer)) : '—'}
        </span>
      ),
    },
    {
      key: 'lastOrder',
      header: 'Last order',
      render: (customer) => (
        <span style={{ fontSize: 11.5, color: colors.muted }}>{formatDateTime(customer.lastOrderAt)}</span>
      ),
    },
    {
      key: 'joined',
      header: 'First seen',
      render: (customer) => (
        <span style={{ fontSize: 11.5, color: colors.muted }}>
          {formatDateTime(customer.firstOrderAt || customer.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Commerce"
        title="Customers"
        subtitle="Every customer is identified by a normalized mobile number and created automatically when an order is placed."
        actions={
          <>
            <Badge tone="gold" dot={false}>{pagination.totalItems} customers</Badge>
            <Button variant="secondary" icon="refresh" onClick={reload} loading={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <Panel bare>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            padding: '16px 18px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or mobile number…"
            style={{ flex: '2 1 260px', maxWidth: 380 }}
          />
          <div style={{ flex: '0 1 160px', minWidth: 150 }}>
            <Select value={sort} aria-label="Sort customers" onChange={(event) => updateSort(event.target.value)}>
              <option value="">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </div>
          {debouncedSearch || sort ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch('');
                updateSort('');
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Customers could not be loaded"
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
          minWidth={900}
          rowKey={(customer) => customer.id || customer._id}
          onRowClick={(customer) => navigate(`/customers/${customer.id || customer._id}`)}
          empty={
            !loading ? (
              <EmptyState
                icon="users"
                title={debouncedSearch ? 'No customers match this search' : 'No customers yet'}
                description={
                  debouncedSearch
                    ? 'Try another name or mobile number, or clear the search.'
                    : 'Customer records are created automatically when a guest completes an order.'
                }
                action={
                  debouncedSearch ? (
                    <Button size="sm" variant="secondary" onClick={() => setSearch('')}>Clear search</Button>
                  ) : null
                }
              />
            ) : null
          }
          footer={<div style={{ padding: '0 16px' }}><Pagination {...pagination} onChange={setPage} /></div>}
        />
      </Panel>

      <div style={{ marginTop: 14, fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
        Editing a customer changes current contact details only. Historical order snapshots keep the name, mobile and
        address captured at checkout.
      </div>
    </PageShell>
  );
}
