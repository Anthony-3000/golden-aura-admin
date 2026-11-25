import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { colors, fonts, radii } from '../lib/theme.js';
import { api, extractList } from '../lib/api.js';
import { formatDateTime, formatINR } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Alert from '../components/ui/Alert.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { PageShell, StackedCell, Thumb } from '../components/ui/Media.jsx';
import { Emblem } from '../components/Brand.jsx';
import Icon from '../components/Icon.jsx';

const QUEUE = [
  { key: 'placed', label: 'Orders to accept', icon: 'receipt', to: '/orders?status=Processing', tone: 'warning' },
  { key: 'pendingPayment', label: 'COD pending', icon: 'ticket', to: '/orders?paymentStatus=Pending', tone: 'gold' },
  { key: 'pendingReviews', label: 'Reviews to moderate', icon: 'star', to: '/reviews?status=Pending', tone: 'info' },
  { key: 'newInquiries', label: 'New inquiries', icon: 'inbox', to: '/inquiries?status=New', tone: 'success' },
];

function countFrom(response) {
  const { items, pagination } = extractList(response?.data);
  return pagination?.totalItems ?? items.length;
}

export default function Dashboard() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [failures, setFailures] = useState(0);
  const [recent, setRecent] = useState({ items: [], loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = 'Dashboard · Golden Aura Admin';
  }, []);

  useEffect(() => {
    let active = true;
    setCountsLoading(true);
    setRecent((state) => ({ ...state, loading: true, error: null }));

    const requests = [
      api.orders.list({ status: 'Processing', page: 1, limit: 1 }),
      api.orders.list({ paymentStatus: 'Pending', page: 1, limit: 1 }),
      api.reviews.list({ status: 'Pending', page: 1, limit: 1 }),
      api.inquiries.list({ status: 'New', page: 1, limit: 1 }),
    ];

    Promise.allSettled(requests).then((results) => {
      if (!active) return;
      const next = {};
      let failed = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') next[QUEUE[index].key] = countFrom(result.value);
        else failed += 1;
      });
      setCounts(next);
      setFailures(failed);
      setCountsLoading(false);
    });

    api.orders
      .list({ page: 1, limit: 6, sort: 'newest' })
      .then((response) => {
        if (!active) return;
        setRecent({ items: extractList(response.data).items, loading: false, error: null });
      })
      .catch((error) => {
        if (!active) return;
        setRecent({ items: [], loading: false, error });
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const firstName = (admin?.name || 'Administrator').split(/\s+/)[0];
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const columns = [
    {
      key: 'order',
      header: 'Order',
      width: '22%',
      render: (order) => (
        <StackedCell
          media={<Thumb src={order.items?.[0]?.productSnapshot?.primaryImageUrl} icon="receipt" size={38} radius={9} />}
          title={order.orderNumber || order.id || 'Order'}
          subtitle={order.customerSnapshot?.name || order.customer?.name || 'Customer'}
        />
      ),
    },
    {
      key: 'placedAt',
      header: 'Placed',
      width: '18%',
      render: (order) => (
        <span style={{ fontSize: 11.5, color: colors.muted }}>
          {formatDateTime(order.placedAt || order.createdAt)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (order) => (
        <span style={{ fontWeight: 500, color: colors.ink }}>
          {formatINR(order.pricing?.finalAmountPaise)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (order) => <StatusBadge status={order.payment?.status || 'Pending'} />,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Overview"
        title={`${greeting}, ${firstName}.`}
        subtitle="A calm view of the house — orders awaiting your word, payments to reconcile and voices from your customers."
        actions={
          <>
            <Button variant="secondary" icon="refresh" onClick={() => setReloadKey((key) => key + 1)}>
              Refresh
            </Button>
            <Button icon="plus" onClick={() => navigate('/products/new')}>
              Add product
            </Button>
          </>
        }
      />

      {failures > 0 ? (
        <Alert tone="info" title="Some modules are not live yet" style={{ marginBottom: 20 }}>
          {failures} dashboard {failures === 1 ? 'queue is' : 'queues are'} unavailable because the matching admin API
          endpoints are not implemented on the server. The interface is wired to the documented endpoints and will fill
          in as they are deployed.
        </Alert>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Orders placed"
          value={counts.placed}
          hint="Awaiting confirmation"
          icon="receipt"
          tone="warning"
          to="/orders?status=Processing"
          loading={countsLoading}
        />
        <StatCard
          label="COD pending"
          value={counts.pendingPayment}
          hint="Collection not yet recorded"
          icon="ticket"
          tone="gold"
          to="/orders?paymentStatus=Pending"
          loading={countsLoading}
        />
        <StatCard
          label="Reviews pending"
          value={counts.pendingReviews}
          hint="Waiting for moderation"
          icon="star"
          tone="info"
          to="/reviews?status=Pending"
          loading={countsLoading}
        />
        <StatCard
          label="New inquiries"
          value={counts.newInquiries}
          hint="Customers to respond to"
          icon="inbox"
          tone="success"
          to="/inquiries?status=New"
          loading={countsLoading}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.9fr) minmax(280px, 0.85fr)',
          gap: 18,
          alignItems: 'start',
        }}
        className="ga-dashboard-grid"
      >
        <style>{'@media (max-width: 1080px){ .ga-dashboard-grid { grid-template-columns: 1fr !important; } }'}</style>

        <Panel
          title="Recent orders"
          subtitle="The newest orders across the house."
          padding={0}
          action={
            <Link to="/orders" style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="ghost" iconRight="arrowRight">
                All orders
              </Button>
            </Link>
          }
        >
          {recent.error ? (
            <EmptyState
              compact
              icon="receipt"
              title="Orders are not available yet"
              description={recent.error.message}
              action={
                <Button size="sm" variant="secondary" icon="refresh" onClick={() => setReloadKey((key) => key + 1)}>
                  Try again
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              rows={recent.loading ? [] : recent.items}
              loading={recent.loading}
              minWidth={640}
              onRowClick={(order) => navigate(`/orders/${order.id || order._id}`)}
              empty={
                <EmptyState
                  compact
                  icon="receipt"
                  title="No orders yet"
                  description="Orders placed on the storefront will appear here for confirmation."
                />
              }
            />
          )}
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Operational queues" subtitle="The day's quiet work." padding={16}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {QUEUE.map((queue) => (
                <Link
                  key={queue.key}
                  to={queue.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '10px 10px',
                    borderRadius: radii.md,
                    textDecoration: 'none',
                    background: 'transparent',
                    transition: 'background .14s ease',
                  }}
                  className="ga-queue-link"
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: colors.cream,
                      color: colors.goldDeep,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={queue.icon} size={15} />
                  </span>
                  <span style={{ flex: 1, fontSize: 12, color: colors.inkSoft, lineHeight: 1.35 }}>{queue.label}</span>
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 21,
                      fontWeight: 600,
                      color: counts[queue.key] ? colors.ink : colors.faint,
                      minWidth: 24,
                      textAlign: 'right',
                    }}
                  >
                    {countsLoading ? '·' : counts[queue.key] ?? '—'}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel bare>
            <div
              style={{
                padding: '22px 20px',
                background: `radial-gradient(120% 120% at 0% 0%, #2E2319, ${colors.sidebar})`,
                color: colors.sidebarText,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <Emblem size={34} color={colors.goldLight} />
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 24,
                  lineHeight: 1.1,
                  fontWeight: 500,
                  color: '#F5EBDC',
                }}
              >
                Curate the house
              </div>
              <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.65, color: '#B7A691' }}>
                Add a product, open a collection or set a coupon — the everyday gestures that keep the aura alive.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 }}>
                {[
                  ['Category', '/categories'],
                  ['Collection', '/collections'],
                  ['Coupon', '/coupons'],
                  ['Delivery', '/delivery'],
                ].map(([label, to]) => (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 10.5,
                      color: '#E7D8C2',
                      textDecoration: 'none',
                      border: '1px solid rgba(212,168,75,.35)',
                      padding: '5px 9px',
                      borderRadius: radii.pill,
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
