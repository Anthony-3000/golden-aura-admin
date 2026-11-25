import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { colors } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDateTime, formatINR } from '../lib/format.js';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../lib/constants.js';
import usePaginatedList from '../hooks/usePaginatedList.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import { Input, Select } from '../components/ui/Field.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import { PageShell, StackedCell, Thumb } from '../components/ui/Media.jsx';

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') || '');
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');

  const params = {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(sort ? { sort } : {}),
  };

  const { items, pagination, loading, error, reload } = usePaginatedList(api.orders.list, params);

  useEffect(() => {
    document.title = 'Orders · Golden Aura Admin';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, paymentStatus, from, to, sort]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPaymentStatus('');
    setFrom('');
    setTo('');
    setSort('');
    setSearchParams({}, { replace: true });
  };

  const columns = [
    {
      key: 'order',
      header: 'Order',
      render: (order) => (
        <StackedCell
          media={
            <Thumb
              src={order.items?.[0]?.productSnapshot?.primaryImageUrl}
              alt={order.items?.[0]?.productSnapshot?.name || 'Order'}
              icon="receipt"
              size={42}
            />
          }
          title={order.orderNumber || order.id || 'Order'}
          subtitle={order.customerSnapshot?.name || order.customer?.name || 'Customer'}
        />
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (order) => (
        <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.55 }}>
          <div>{order.customerSnapshot?.mobile || order.customer?.mobile || '—'}</div>
          <div style={{ fontSize: 10.5, color: colors.faint }}>{order.customerSnapshot?.email || order.customer?.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'placed',
      header: 'Placed',
      render: (order) => (
        <span style={{ fontSize: 11.5, color: colors.muted }}>{formatDateTime(order.placedAt || order.createdAt)}</span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      width: 60,
      render: (order) => (
        <span style={{ fontSize: 12, color: colors.muted }}>
          {Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Final amount',
      align: 'right',
      render: (order) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>
          {formatINR(order.pricing?.finalAmountPaise)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Order',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (order) => <StatusBadge status={order.payment?.status || 'Pending'} />,
    },
  ];

  const hasFilters = Boolean(debouncedSearch || status || paymentStatus || from || to || sort);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        subtitle="Search and filter every COD order, open the full snapshot and move it through fulfilment."
        actions={
          <>
            <Badge tone="gold" dot={false}>{pagination.totalItems} orders</Badge>
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
            placeholder="Order ID, customer name or mobile…"
            style={{ flex: '2 1 260px', maxWidth: 360 }}
          />
          <div style={{ flex: '0 1 150px', minWidth: 140 }}>
            <Select
              value={status}
              aria-label="Filter by order status"
              onChange={(event) => {
                setStatus(event.target.value);
                updateParam('status', event.target.value);
              }}
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '0 1 150px', minWidth: 140 }}>
            <Select
              value={paymentStatus}
              aria-label="Filter by payment status"
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                updateParam('paymentStatus', event.target.value);
              }}
            >
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '0 1 145px', minWidth: 135 }}>
            <Input
              type="date"
              value={from}
              aria-label="From date"
              onChange={(event) => {
                setFrom(event.target.value);
                updateParam('from', event.target.value);
              }}
              style={{ fontSize: 12, padding: '9px 10px' }}
            />
          </div>
          <div style={{ flex: '0 1 145px', minWidth: 135 }}>
            <Input
              type="date"
              value={to}
              aria-label="To date"
              onChange={(event) => {
                setTo(event.target.value);
                updateParam('to', event.target.value);
              }}
              style={{ fontSize: 12, padding: '9px 10px' }}
            />
          </div>
          <div style={{ flex: '0 1 140px', minWidth: 130 }}>
            <Select value={sort} aria-label="Sort orders" onChange={(event) => setSort(event.target.value)}>
              <option value="">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </div>
          {hasFilters ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
          ) : null}
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Orders could not be loaded"
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
          minWidth={980}
          rowKey={(order) => order.id || order._id}
          onRowClick={(order) => navigate(`/orders/${order.id || order._id}`)}
          empty={
            !loading ? (
              <EmptyState
                icon="receipt"
                title={hasFilters ? 'No orders match these filters' : 'No orders yet'}
                description={
                  hasFilters
                    ? 'Try clearing the search or widening the date range.'
                    : 'Customer orders will arrive here the moment checkout is complete.'
                }
                action={hasFilters ? <Button size="sm" variant="secondary" onClick={clearFilters}>Clear filters</Button> : null}
              />
            ) : null
          }
          footer={<div style={{ padding: '0 16px' }}><Pagination {...pagination} onChange={setPage} /></div>}
        />
      </Panel>

      <div style={{ marginTop: 14, fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
        Orders move through Processing, Accepted, Shipping and Delivered. Payment status is separate from fulfilment and
        becomes Paid only when collection is recorded.
      </div>
    </PageShell>
  );
}
