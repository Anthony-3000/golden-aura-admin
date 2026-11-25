import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fonts, radii } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDateTime, formatINR, initials } from '../lib/format.js';
import { INDIAN_STATES } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Field, FormGrid, Input, Select } from '../components/ui/Field.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { Divider, KeyValue, PageShell, SectionTitle } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

const emptyAddress = {
  houseOrFlat: '',
  streetLocality: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

const emptyForm = {
  name: '',
  mobile: '',
  email: '',
  currentAddress: emptyAddress,
};

function addressKey(address) {
  if (!address) return '';
  return [
    address.houseOrFlat,
    address.streetLocality,
    address.city,
    address.state,
    address.pincode,
    address.landmark,
  ]
    .map((part) => String(part || '').trim().toLowerCase())
    .join('|');
}

function AddressLine({ address }) {
  const lines = [
    address?.houseOrFlat,
    address?.streetLocality,
    [address?.city, address?.state].filter(Boolean).join(', '),
    address?.pincode,
    address?.landmark ? `Landmark: ${address.landmark}` : null,
  ].filter(Boolean);
  if (!lines.length) return <span style={{ fontSize: 12, color: colors.faint }}>No address on file.</span>;
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: colors.inkSoft }}>
      {lines.map((line, index) => (
        <div key={`${line}-${index}`}>{line}</div>
      ))}
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [orders, setOrders] = useState({ items: [], pagination: null, loading: true, error: null });
  const [orderPage, setOrderPage] = useState(1);
  const [orderVersion, setOrderVersion] = useState(0);

  const loadCustomer = () => {
    setLoading(true);
    api.customers
      .get(id)
      .then((response) => {
        const data = response.data?.customer || response.data;
        setCustomer(data);
        setForm({
          name: data?.name || '',
          mobile: data?.mobile || '',
          email: data?.email || '',
          currentAddress: { ...emptyAddress, ...(data?.currentAddress || {}) },
        });
        setError(null);
      })
      .catch((loadError) => setError(loadError))
      .finally(() => setLoading(false));
  };

  useEffect(loadCustomer, [id]);

  useEffect(() => {
    setOrderPage(1);
  }, [id]);

  useEffect(() => {
    let active = true;
    setOrders((state) => ({ ...state, loading: true, error: null }));
    api.customers
      .orders(id, { page: orderPage, limit: 10 })
      .then((response) => {
        if (!active) return;
        const payload = response.data || {};
        const items = Array.isArray(payload)
          ? payload
          : payload.orders || payload.items || [];
        const pagination = payload.pagination || null;
        setOrders({
          items,
          pagination: pagination || {
            page: orderPage,
            limit: 10,
            totalItems: items.length,
            totalPages: Math.max(1, Math.ceil(items.length / 10)),
          },
          loading: false,
          error: null,
        });
      })
      .catch((orderError) => {
        if (!active) return;
        setOrders({ items: [], pagination: null, loading: false, error: orderError });
      });
    return () => {
      active = false;
    };
  }, [id, orderPage, orderVersion]);

  useEffect(() => {
    document.title = customer?.name ? `${customer.name} · Customers` : 'Customer · Golden Aura Admin';
  }, [customer]);

  const stats = useMemo(() => {
    const orderItems = orders.items || [];
    const totalOrders =
      customer?.totalOrders ?? customer?.orderCount ?? orders.pagination?.totalItems ?? orderItems.length;
    const totalValue =
      customer?.totalOrderValuePaise ??
      customer?.totalSpendPaise ??
      customer?.totalSpendingPaise ??
      orderItems.reduce((sum, order) => sum + (order.pricing?.finalAmountPaise || 0), 0);
    const firstOrder = customer?.firstOrderAt || orderItems[orderItems.length - 1]?.placedAt || customer?.createdAt;
    const lastOrder = customer?.lastOrderAt || orderItems[0]?.placedAt || customer?.createdAt;
    return { totalOrders, totalValue, firstOrder, lastOrder };
  }, [customer, orders]);

  const addressHistory = useMemo(() => {
    const seen = new Map();
    const explicit = Array.isArray(customer?.addressHistory) ? customer.addressHistory : [];
    explicit.forEach((entry) => {
      const address = entry.address || entry;
      const key = addressKey(address);
      if (key && !seen.has(key)) seen.set(key, { address, orders: [] });
    });
    (orders.items || []).forEach((order) => {
      const address = order.deliveryAddress;
      const key = addressKey(address);
      if (!key) return;
      if (!seen.has(key)) seen.set(key, { address, orders: [] });
      seen.get(key).orders.push({
        orderNumber: order.orderNumber,
        placedAt: order.placedAt || order.createdAt,
        orderId: order.id || order._id,
      });
    });
    return [...seen.values()];
  }, [customer, orders.items]);

  const set = (patch) => setForm((state) => ({ ...state, ...patch }));
  const setAddress = (patch) =>
    setForm((state) => ({ ...state, currentAddress: { ...state.currentAddress, ...patch } }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('A customer name is required.');
    if (!/^[+]?[\d\s-]{10,16}$/.test(form.mobile.trim())) {
      return setFormError('Enter a valid mobile number (10–15 digits).');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setFormError('Enter a valid email address.');
    }
    const address = form.currentAddress;
    if (!address.houseOrFlat.trim() || !address.streetLocality.trim() || !address.city.trim()) {
      return setFormError('House, street and city are required in the delivery address.');
    }
    if (!address.state.trim()) return setFormError('Choose the delivery state.');
    if (!/^\d{6}$/.test(address.pincode.trim())) return setFormError('Enter a valid 6-digit pincode.');
    if (!address.landmark.trim()) return setFormError('A landmark is required in the delivery address.');

    setSaving(true);
    try {
      await api.customers.update(id, {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        currentAddress: {
          houseOrFlat: address.houseOrFlat.trim(),
          streetLocality: address.streetLocality.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
          landmark: address.landmark.trim(),
        },
      });
      toast.success('Customer details updated. Historical orders are unchanged.');
      loadCustomer();
      setOrderVersion((value) => value + 1);
    } catch (saveError) {
      setFormError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !customer) return <PageLoader label="Opening the customer profile…" />;

  if (error && !customer) {
    return (
      <PageShell>
        <PageHeader eyebrow="Customer" title="Customer profile" />
        <Alert
          tone="error"
          title="This customer could not be loaded"
          action={
            <Button size="sm" variant="secondary" icon="arrowLeft" onClick={() => navigate('/customers')}>
              Back to customers
            </Button>
          }
        >
          {error.message}
        </Alert>
      </PageShell>
    );
  }

  const orderColumns = [
    {
      key: 'order',
      header: 'Order',
      render: (order) => (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>
            {order.orderNumber || order.id || 'Order'}
          </div>
          <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
            {Array.isArray(order.items)
              ? `${order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)} pieces`
              : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'placed',
      header: 'Placed',
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
        <span style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>
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
        eyebrow="Customer"
        title={customer?.name || 'Customer profile'}
        subtitle={`Identified by ${customer?.normalizedMobile || customer?.mobile || 'mobile number'} · joined ${formatDateTime(
          customer?.createdAt,
        )}`}
        actions={
          <>
            <Button variant="secondary" icon="arrowLeft" onClick={() => navigate('/customers')}>
              Back
            </Button>
            <Button type="submit" form="customer-form" icon="check" loading={saving}>
              Save changes
            </Button>
          </>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard label="Total orders" value={stats.totalOrders} hint="Orders linked to this customer" icon="receipt" />
        <StatCard
          label="Lifetime value"
          value={formatINR(stats.totalValue)}
          hint="Across all orders"
          icon="ticket"
          tone="gold"
        />
        <StatCard
          label="First order"
          value={formatDateTime(stats.firstOrder).split(',')[0]}
          hint={formatDateTime(stats.firstOrder)}
          icon="calendar"
          tone="info"
        />
        <StatCard
          label="Most recent"
          value={formatDateTime(stats.lastOrder).split(',')[0]}
          hint={formatDateTime(stats.lastOrder)}
          icon="clock"
          tone="success"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, 0.75fr)',
          gap: 18,
          alignItems: 'start',
          marginBottom: 18,
        }}
        className="ga-customer-grid"
      >
        <style>{'@media (max-width: 1040px){ .ga-customer-grid { grid-template-columns: 1fr !important; } }'}</style>

        <form id="customer-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {formError ? <Alert tone="error" title="Please check the form">{formError}</Alert> : null}

          <Panel title="Profile" subtitle="Current contact details used for future orders and communication.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Full name" required htmlFor="customer-name">
                <Input
                  id="customer-name"
                  value={form.name}
                  onChange={(event) => set({ name: event.target.value })}
                  maxLength={120}
                />
              </Field>
              <FormGrid>
                <Field
                  label="Mobile number"
                  required
                  hint="Normalized by the backend. Must remain unique across customers."
                >
                  <Input
                    value={form.mobile}
                    onChange={(event) => set({ mobile: event.target.value })}
                    inputMode="tel"
                    maxLength={16}
                  />
                </Field>
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => set({ email: event.target.value })}
                    maxLength={160}
                  />
                </Field>
              </FormGrid>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '10px 12px',
                  background: colors.champagne,
                  border: '1px solid #EBD9B8',
                  borderRadius: radii.sm,
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: colors.inkSoft,
                }}
              >
                <Icon name="alert" size={14} style={{ color: colors.goldDeep, marginTop: 1, flexShrink: 0 }} />
                Changing the mobile number changes the customer matching key. Existing order snapshots keep the old
                number.
              </div>
            </div>
          </Panel>

          <Panel
            title="Current delivery address"
            subtitle="The address used for the customer's next order. Historical addresses stay frozen on past orders."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormGrid>
                <Field label="House / flat" required>
                  <Input
                    value={form.currentAddress.houseOrFlat}
                    onChange={(event) => setAddress({ houseOrFlat: event.target.value })}
                    maxLength={160}
                  />
                </Field>
                <Field label="Street / locality" required>
                  <Input
                    value={form.currentAddress.streetLocality}
                    onChange={(event) => setAddress({ streetLocality: event.target.value })}
                    maxLength={180}
                  />
                </Field>
                <Field label="City" required>
                  <Input
                    value={form.currentAddress.city}
                    onChange={(event) => setAddress({ city: event.target.value })}
                    maxLength={100}
                  />
                </Field>
                <Field label="State" required>
                  <Select
                    value={form.currentAddress.state}
                    onChange={(event) => setAddress({ state: event.target.value })}
                  >
                    <option value="">Select a state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state.code} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Pincode" required>
                  <Input
                    value={form.currentAddress.pincode}
                    onChange={(event) => setAddress({ pincode: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                    inputMode="numeric"
                    maxLength={6}
                  />
                </Field>
                <Field label="Landmark" required>
                  <Input
                    value={form.currentAddress.landmark}
                    onChange={(event) => setAddress({ landmark: event.target.value })}
                    maxLength={160}
                  />
                </Field>
              </FormGrid>
            </div>
          </Panel>

          <div style={{ display: 'flex', gap: 9 }}>
            <Button type="submit" icon="check" loading={saving}>
              Save changes
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setForm({
                  name: customer?.name || '',
                  mobile: customer?.mobile || '',
                  email: customer?.email || '',
                  currentAddress: { ...emptyAddress, ...(customer?.currentAddress || {}) },
                });
                setFormError('');
              }}
            >
              Reset
            </Button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Address history" subtitle="Distinct addresses from linked orders.">
            {addressHistory.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {addressHistory.map((entry, index) => (
                  <div key={index}>
                    {index > 0 ? <Divider style={{ marginBottom: 14 }} /> : null}
                    <AddressLine address={entry.address} />
                    {entry.orders.length ? (
                      <div style={{ marginTop: 6, fontSize: 10, color: colors.faint, lineHeight: 1.6 }}>
                        {entry.orders
                          .slice(0, 3)
                          .map((order) => order.orderNumber || order.orderId)
                          .filter(Boolean)
                          .join(' · ')}
                        {entry.orders.length > 3 ? ` +${entry.orders.length - 3} more` : ''}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: colors.faint }}>No historical addresses yet.</span>
            )}
          </Panel>

          <Panel title="Record">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: colors.champagne,
                    border: `1px solid #EBD9B8`,
                    color: colors.goldDeep,
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: fonts.display,
                    fontSize: 17,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initials(customer?.name)}
                </span>
                <div>
                  <div style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 600, color: colors.ink }}>
                    {customer?.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: colors.faint }}>{customer?.email}</div>
                </div>
              </div>
              <Divider />
              <KeyValue label="Customer ID" value={customer?.id || customer?._id || id} mono />
              <KeyValue label="Normalized mobile" value={customer?.normalizedMobile} mono />
              <KeyValue label="Created" value={formatDateTime(customer?.createdAt)} />
              <KeyValue label="Last updated" value={formatDateTime(customer?.updatedAt)} />
              <div style={{ paddingTop: 4 }}>
                <SectionTitle note="Guest checkout">Notes</SectionTitle>
                <p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.65, color: colors.faint }}>
                  Customers have no login or profile on the storefront. This record is maintained by the house through
                  successful orders and admin edits.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Order history"
        subtitle="Every order linked to this customer, newest first."
        padding={0}
        action={
          <Button
            size="sm"
            variant="ghost"
            icon="refresh"
            onClick={() => setOrderVersion((value) => value + 1)}
            loading={orders.loading}
          >
            Refresh
          </Button>
        }
      >
        {orders.error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Order history could not be loaded"
              action={
                <Button size="sm" variant="secondary" icon="refresh" onClick={() => setOrderVersion((value) => value + 1)}>
                  Retry
                </Button>
              }
            >
              {orders.error.message}
            </Alert>
          </div>
        ) : null}
        <DataTable
          columns={orderColumns}
          rows={orders.items}
          loading={orders.loading}
          minWidth={700}
          rowKey={(order) => order.id || order._id || order.orderNumber}
          onRowClick={(order) => navigate(`/orders/${order.id || order._id}`)}
          empty={
            !orders.loading ? (
              <EmptyState
                compact
                icon="receipt"
                title="No orders yet"
                description="When this customer places an order, it will appear here."
              />
            ) : null
          }
          footer={
            orders.pagination ? (
              <div style={{ padding: '0 16px' }}>
                <Pagination {...orders.pagination} onChange={setOrderPage} />
              </div>
            ) : null
          }
        />
      </Panel>
    </PageShell>
  );
}
