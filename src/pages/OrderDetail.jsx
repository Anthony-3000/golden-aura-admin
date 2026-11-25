import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fonts, radii } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDateTime, formatINR, initials } from '../lib/format.js';
import { ORDER_STATUSES } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Modal from '../components/ui/Modal.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import MoneyInput from '../components/ui/MoneyInput.jsx';
import { Field, Select, Textarea } from '../components/ui/Field.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { Divider, KeyValue, PageShell, SectionTitle, StackedCell, Thumb } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

const TIMELINE_TONE = {
  Placed: colors.warning,
  Confirmed: colors.info,
  Processing: colors.warning,
  Accepted: colors.info,
  Shipping: colors.gold,
  Shipped: colors.gold,
  Delivered: colors.success,
  Cancelled: colors.danger,
};

function addressLines(address) {
  if (!address) return [];
  return [
    address.houseOrFlat,
    address.streetLocality,
    [address.city, address.state].filter(Boolean).join(', '),
    address.pincode,
    address.landmark ? `Landmark: ${address.landmark}` : null,
  ].filter(Boolean);
}

function MoneyRow({ label, value, strong = false, muted = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
      <span style={{ fontSize: strong ? 12.5 : 12, color: muted ? colors.faint : colors.muted }}>{label}</span>
      <span
        style={{
          fontFamily: strong ? fonts.display : fonts.body,
          fontSize: strong ? 22 : 12.5,
          fontWeight: strong ? 600 : 500,
          color: strong ? colors.ink : colors.inkSoft,
          letterSpacing: strong ? -0.2 : 0,
        }}
      >
        {formatINR(value)}
      </span>
    </div>
  );
}

function AddressBlock({ address }) {
  const lines = addressLines(address);
  if (!lines.length) return <span style={{ fontSize: 12.5, color: colors.faint }}>No address captured.</span>;
  return (
    <div style={{ display: 'flex', gap: 9 }}>
      <Icon name="pin" size={15} style={{ color: colors.gold, marginTop: 2, flexShrink: 0 }} />
      <div style={{ fontSize: 12.5, lineHeight: 1.7, color: colors.inkSoft }}>
        {lines.map((line, index) => (
          <div key={`${line}-${index}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function Timeline({ history = [] }) {
  const entries = [...history];
  if (!entries.length) {
    return <span style={{ fontSize: 12.5, color: colors.faint }}>No status history has been recorded yet.</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {entries.map((entry, index) => {
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
              {index < entries.length - 1 ? (
                <span style={{ width: 1, flex: 1, background: colors.border, minHeight: 26 }} />
              ) : null}
            </div>
            <div style={{ paddingBottom: index < entries.length - 1 ? 16 : 0, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <StatusBadge status={entry.status} />
                <span style={{ fontSize: 10.5, color: colors.faint }}>{formatDateTime(entry.changedAt)}</span>
              </div>
              {entry.note ? (
                <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.6, color: colors.inkSoft }}>{entry.note}</p>
              ) : null}
              {entry.cancellationReason ? (
                <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.6, color: colors.danger }}>
                  Reason: {entry.cancellationReason}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InvoicePreview({ data, fallback }) {
  const invoice = data?.invoice || data || {};
  const order = fallback || {};
  const customer = invoice.customerSnapshot || invoice.customer || order.customerSnapshot || {};
  const address = invoice.deliveryAddress || order.deliveryAddress;
  const items = invoice.items || order.items || [];
  const pricing = invoice.pricing || order.pricing || {};
  const payment = invoice.payment || order.payment || {};

  return (
    <div style={{ background: '#FFFDF9', border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 600, color: colors.ink, letterSpacing: 0.4 }}>
            GOLDEN AURA
          </div>
          <div style={{ fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.gold, marginTop: 2 }}>
            Invoice
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.ink }}>
            {invoice.orderNumber || order.orderNumber || 'Order'}
          </div>
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
            {formatDateTime(invoice.placedAt || invoice.createdAt || order.placedAt || order.createdAt)}
          </div>
        </div>
      </div>

      <Divider style={{ margin: '18px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.faint, marginBottom: 5 }}>
            Customer
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>{customer.name || '—'}</div>
          <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.6 }}>{customer.mobile || ''}</div>
          <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.6 }}>{customer.email || ''}</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.faint, marginBottom: 5 }}>
            Delivery address
          </div>
          <AddressBlock address={address} />
        </div>
      </div>

      <div style={{ marginTop: 20, border: `1px solid ${colors.border}`, borderRadius: radii.sm, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: fonts.body }}>
          <thead>
            <tr style={{ background: '#FCF8F1' }}>
              {['Item', 'Qty', 'Unit', 'Line total'].map((heading, index) => (
                <th
                  key={heading}
                  style={{
                    textAlign: index === 0 ? 'left' : 'right',
                    padding: '8px 10px',
                    fontSize: 9,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: colors.muted,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '9px 10px', fontSize: 11.5, color: colors.inkSoft, borderBottom: `1px solid #F3ECE1` }}>
                  {item.productSnapshot?.name || item.name || 'Item'}
                </td>
                <td style={{ padding: '9px 10px', fontSize: 11.5, textAlign: 'right', borderBottom: `1px solid #F3ECE1` }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '9px 10px', fontSize: 11.5, textAlign: 'right', borderBottom: `1px solid #F3ECE1` }}>
                  {formatINR(item.unitPricePaise)}
                </td>
                <td style={{ padding: '9px 10px', fontSize: 11.5, textAlign: 'right', borderBottom: `1px solid #F3ECE1` }}>
                  {formatINR(item.lineTotalPaise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 16, marginLeft: 'auto', maxWidth: 280 }}>
        <MoneyRow label="Merchandise subtotal" value={pricing.merchandiseSubtotalPaise} />
        {pricing.couponDiscountPaise ? (
          <MoneyRow label="Coupon discount" value={-pricing.couponDiscountPaise} />
        ) : null}
        <MoneyRow label="Delivery charge" value={pricing.deliveryChargePaise} />
        <Divider style={{ margin: '4px 0' }} />
        <MoneyRow label="Final amount" value={pricing.finalAmountPaise} strong />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <StatusBadge status={payment.status || 'Pending'} />
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 9.5, color: colors.faint, lineHeight: 1.6 }}>
        This is an operational invoice, not a tax document. GST and statutory invoice numbering are outside Version 1.
      </div>
    </div>
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function invoiceHtml(data, fallback) {
  const invoice = data?.invoice || data || {};
  const order = fallback || {};
  const customer = invoice.customerSnapshot || invoice.customer || order.customerSnapshot || {};
  const address = invoice.deliveryAddress || order.deliveryAddress || {};
  const items = invoice.items || order.items || [];
  const pricing = invoice.pricing || order.pricing || {};
  const payment = invoice.payment || order.payment || {};
  const lines = addressLines(address).map((line) => escapeHtml(line)).join('<br/>');

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${
    escapeHtml(invoice.orderNumber || order.orderNumber || '')
  }</title><style>
    *{box-sizing:border-box}
    body{font-family:Georgia,serif;color:#241A12;margin:36px;}
    .head{display:flex;justify-content:space-between;border-bottom:1px solid #E7DAC6;padding-bottom:18px}
    .brand{font-size:28px;letter-spacing:3px}
    .eyebrow{font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#B8873A}
    .muted{font-family:Arial,sans-serif;color:#8B7A67;font-size:12px}
    .cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:22px 0}
    table{width:100%;border-collapse:collapse;font-family:Arial,sans-serif}
    th{font-size:9px;letter-spacing:1px;text-transform:uppercase;text-align:left;color:#8B7A67;border-bottom:1px solid #E7DAC6;padding:8px 6px}
    td{font-size:12px;padding:9px 6px;border-bottom:1px solid #F3ECE1}
    .num{text-align:right}
    .totals{margin-left:auto;width:280px;margin-top:18px;font-family:Arial,sans-serif;font-size:12px}
    .totals div{display:flex;justify-content:space-between;padding:4px 0}
    .totals .final{font-family:Georgia,serif;font-size:22px;border-top:1px solid #E7DAC6;margin-top:6px;padding-top:10px}
    .note{font-family:Arial,sans-serif;font-size:9px;color:#B3A390;margin-top:26px}
  </style></head><body>
    <div class="head">
      <div><div class="brand">GOLDEN AURA</div><div class="eyebrow">Invoice</div></div>
      <div style="text-align:right">
        <div style="font-size:13px">${escapeHtml(invoice.orderNumber || order.orderNumber || 'Order')}</div>
        <div class="muted">${escapeHtml(formatDateTime(invoice.placedAt || order.placedAt || order.createdAt))}</div>
      </div>
    </div>
    <div class="cols">
      <div><div class="eyebrow">Customer</div><div>${escapeHtml(customer.name || '—')}</div><div class="muted">${escapeHtml(
        customer.mobile || '',
      )}<br/>${escapeHtml(customer.email || '')}</div></div>
      <div><div class="eyebrow">Delivery address</div><div class="muted">${lines || '—'}</div></div>
    </div>
    <table>
      <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Line total</th></tr></thead>
      <tbody>${items
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.productSnapshot?.name || item.name || 'Item')}</td><td class="num">${escapeHtml(
              item.quantity,
            )}</td><td class="num">${escapeHtml(formatINR(item.unitPricePaise))}</td><td class="num">${escapeHtml(
              formatINR(item.lineTotalPaise),
            )}</td></tr>`,
        )
        .join('')}</tbody>
    </table>
    <div class="totals">
      <div><span>Merchandise subtotal</span><span>${escapeHtml(formatINR(pricing.merchandiseSubtotalPaise))}</span></div>
      ${
        pricing.couponDiscountPaise
          ? `<div><span>Coupon discount</span><span>-${escapeHtml(formatINR(pricing.couponDiscountPaise))}</span></div>`
          : ''
      }
      <div><span>Delivery charge</span><span>${escapeHtml(formatINR(pricing.deliveryChargePaise))}</span></div>
      <div class="final"><span>Final amount</span><span>${escapeHtml(formatINR(pricing.finalAmountPaise))}</span></div>
      <div><span>Payment</span><span>${escapeHtml(payment.status || 'Pending')}</span></div>
    </div>
    <div class="note">Operational invoice. GST and statutory invoice numbering are outside Version 1.</div>
  </body></html>`;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '', cancellationReason: '' });
  const [statusError, setStatusError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amountCollectedPaise: null, collectionNote: '' });
  const [paymentError, setPaymentError] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.orders
      .get(id)
      .then((response) => {
        setOrder(response.data?.order || response.data);
        setError(null);
      })
      .catch((loadError) => setError(loadError))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    document.title = order?.orderNumber
      ? `${order.orderNumber} · Orders`
      : 'Order · Golden Aura Admin';
  }, [order]);

  const orderId = order?.id || order?._id || id;
  const customer = order?.customerSnapshot || order?.customer || {};
  const address = order?.deliveryAddress;
  const items = Array.isArray(order?.items) ? order.items : [];
  const pricing = order?.pricing || {};
  const payment = order?.payment || {};
  const history = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
  const adminNotes = Array.isArray(order?.adminNotes) ? order.adminNotes : [];
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const customerId = useMemo(() => {
    const value = order?.customer;
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value.id || value._id || null;
  }, [order]);

  const nextStatus = { Processing: 'Accepted', Accepted: 'Shipping', Shipping: 'Delivered' }[order?.status];
  const statusOptions = ORDER_STATUSES.filter(value => value === nextStatus || (value === 'Cancelled' && order?.status !== 'Cancelled'));

  const openStatus = () => {
    const next = nextStatus || 'Cancelled';
    setStatusForm({ status: next, note: '', cancellationReason: '' });
    setStatusError('');
    setStatusOpen(true);
  };

  const submitStatus = async (event) => {
    event.preventDefault();
    setStatusError('');
    if (!statusForm.status) return setStatusError('Choose the next status.');
    if (statusForm.status === order?.status) return setStatusError('The order is already in that status.');
    if (statusForm.status === 'Cancelled' && !statusForm.cancellationReason.trim()) {
      return setStatusError('A cancellation reason is required.');
    }

    const payload = { status: statusForm.status };
    if (statusForm.note.trim()) payload.note = statusForm.note.trim();
    if (statusForm.status === 'Cancelled') payload.cancellationReason = statusForm.cancellationReason.trim();

    setSavingStatus(true);
    try {
      await api.orders.setStatus(orderId, payload);
      toast.success(`Order moved to ${statusForm.status}.`);
      setStatusOpen(false);
      load();
    } catch (statusFailure) {
      setStatusError(statusFailure.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const openPayment = () => {
    setPaymentForm({
      amountCollectedPaise: pricing.finalAmountPaise ?? null,
      collectionMethod: 'Cash',
      collectionNote: '',
    });
    setPaymentError('');
    setPaymentOpen(true);
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    setPaymentError('');
    const collected = paymentForm.amountCollectedPaise;
    if (collected === null || collected === undefined || collected < 0) {
      return setPaymentError('Enter the amount collected.');
    }
    if (pricing.finalAmountPaise !== undefined && collected !== pricing.finalAmountPaise) {
      return setPaymentError(
        `Record the full payable amount of ${formatINR(pricing.finalAmountPaise)}. Partial collection is not part of Version 1.`,
      );
    }
    setSavingPayment(true);
    try {
      await api.orders.recordPayment(orderId, {
        status: 'Paid',
        amountCollectedPaise: collected,
        collectionMethod: paymentForm.collectionMethod,
        ...(paymentForm.collectionNote.trim() ? { collectionNote: paymentForm.collectionNote.trim() } : {}),
      });
      toast.success('COD collection recorded.');
      setPaymentOpen(false);
      load();
    } catch (paymentFailure) {
      setPaymentError(paymentFailure.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await api.orders.addNote(orderId, note.trim());
      toast.success('Internal note added.');
      setNote('');
      load();
    } catch (noteError) {
      toast.error(noteError.message);
    } finally {
      setSavingNote(false);
    }
  };

  const openInvoice = async () => {
    setInvoiceBusy(true);
    try {
      const result = await api.orders.invoice(orderId);
      if (result.type === 'pdf') {
        const url = URL.createObjectURL(result.blob);
        const opened = window.open(url, '_blank', 'noopener');
        if (!opened) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${order?.orderNumber || orderId}.pdf`;
          link.click();
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        toast.info('The invoice opened in a new tab.');
      } else {
        setInvoiceData(result.data);
        setInvoiceOpen(true);
      }
    } catch (invoiceError) {
      toast.error(invoiceError.message, 'Invoice unavailable');
    } finally {
      setInvoiceBusy(false);
    }
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.warning('Allow pop-ups to print the invoice.');
      return;
    }
    printWindow.document.write(invoiceHtml(invoiceData, order));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  if (loading && !order) return <PageLoader label="Opening the order…" />;

  if (error && !order) {
    return (
      <PageShell>
        <PageHeader eyebrow="Order" title="Order detail" />
        <Alert
          tone="error"
          title="This order could not be loaded"
          action={
            <Button size="sm" variant="secondary" icon="arrowLeft" onClick={() => navigate('/orders')}>
              Back to orders
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
        eyebrow="Order"
        title={order?.orderNumber || 'Order'}
        subtitle={
          order
            ? `Placed ${formatDateTime(order.placedAt || order.createdAt)} · ${itemCount} ${
                itemCount === 1 ? 'piece' : 'pieces'
              } · ${formatINR(pricing.finalAmountPaise)}`
            : undefined
        }
        actions={
          <>
            <Button variant="secondary" icon="arrowLeft" onClick={() => navigate('/orders')}>
              Back
            </Button>
            <Button variant="secondary" icon="print" onClick={openInvoice} loading={invoiceBusy}>
              Invoice
            </Button>
            {payment.status !== 'Paid' ? (
              <Button variant="secondary" icon="ticket" onClick={openPayment}>
                Record COD
              </Button>
            ) : null}
            {order?.status !== 'Cancelled' && <Button icon="check" onClick={openStatus}>{order?.status === 'Processing' ? 'Accept or cancel' : 'Update status'}</Button>}
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
        <StatusBadge status={order?.status} />
        <StatusBadge status={payment.status || 'Pending'} />
        <Badge tone="neutral" dot={false}>{payment.mode || 'COD'}</Badge>
        {order?.couponSnapshot?.code ? (
          <Badge tone="gold">Coupon {order.couponSnapshot.code}</Badge>
        ) : null}
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: colors.faint, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={13} />
          {formatDateTime(order?.placedAt || order?.createdAt)}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.65fr) minmax(280px, 0.8fr)',
          gap: 18,
          alignItems: 'start',
        }}
        className="ga-order-grid"
      >
        <style>{'@media (max-width: 1040px){ .ga-order-grid { grid-template-columns: 1fr !important; } }'}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Ordered pieces" subtitle="Product, quantity and price snapshots from the moment of checkout." padding={0}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontFamily: fonts.body }}>
                <thead>
                  <tr style={{ background: '#FCF9F4' }}>
                    {['Piece', 'Unit price', 'Qty', 'Line total'].map((heading, index) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: index === 0 ? 'left' : 'right',
                          padding: '10px 18px',
                          fontSize: 9.5,
                          fontWeight: 600,
                          letterSpacing: 1.2,
                          textTransform: 'uppercase',
                          color: colors.muted,
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || item._id || index}>
                      <td style={{ padding: '13px 18px', borderBottom: `1px solid #F3ECE1` }}>
                        <StackedCell
                          media={
                            <Thumb
                              src={item.productSnapshot?.primaryImageUrl}
                              alt={item.productSnapshot?.name || 'Item'}
                              icon="gem"
                              size={46}
                            />
                          }
                          title={item.productSnapshot?.name || 'Piece'}
                          subtitle={[item.productSnapshot?.categoryName, item.productSnapshot?.material]
                            .filter(Boolean)
                            .join(' · ') || 'Catalogue piece'}
                          meta={
                            item.productSnapshot?.size ? (
                              <span style={{ fontSize: 10, color: colors.faint }}>Size {item.productSnapshot.size}</span>
                            ) : null
                          }
                        />
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: 12.5, borderBottom: `1px solid #F3ECE1` }}>
                        {formatINR(item.unitPricePaise)}
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: 12.5, borderBottom: `1px solid #F3ECE1` }}>
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          padding: '13px 18px',
                          textAlign: 'right',
                          fontSize: 13,
                          fontWeight: 500,
                          color: colors.ink,
                          borderBottom: `1px solid #F3ECE1`,
                        }}
                      >
                        {formatINR(item.lineTotalPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 18px', borderTop: `1px solid ${colors.border}`, background: '#FCF9F4' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxWidth: 340, marginLeft: 'auto' }}>
                <MoneyRow label="Merchandise subtotal" value={pricing.merchandiseSubtotalPaise} />
                {pricing.couponDiscountPaise ? (
                  <MoneyRow label="Coupon discount" value={-pricing.couponDiscountPaise} />
                ) : null}
                <MoneyRow label="Delivery charge" value={pricing.deliveryChargePaise} />
                <Divider style={{ margin: '3px 0' }} />
                <MoneyRow label="Final amount" value={pricing.finalAmountPaise} strong />
              </div>
            </div>
          </Panel>

          <Panel title="Status history" subtitle="Append-only activity recorded by the backend.">
            <Timeline history={history} />
          </Panel>

          <Panel title="Internal notes" subtitle="Only administrators see these notes; public tracking never returns them.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form onSubmit={addNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a private note for the team…"
                  maxLength={1000}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" size="sm" icon="plus" loading={savingNote} disabled={!note.trim()}>
                    Add note
                  </Button>
                </div>
              </form>

              {adminNotes.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[...adminNotes].reverse().map((entry, index) => (
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
          <Panel title="Payment" subtitle="Cash on delivery is the only payment mode.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 11, color: colors.muted }}>COD status</span>
                <StatusBadge status={payment.status || 'Pending'} />
              </div>
              <KeyValue label="Amount collected" value={formatINR(payment.amountCollectedPaise ?? 0)} />
              <KeyValue label="Collection method" value={payment.collectionMethod || 'Not recorded'} />
              <KeyValue label="Collected at" value={formatDateTime(payment.collectedAt)} />
              {payment.collectionNote ? <KeyValue label="Collection note" value={payment.collectionNote} /> : null}
              {payment.status !== 'Paid' ? (
                <Button variant="secondary" size="sm" icon="ticket" fullWidth onClick={openPayment}>
                  Record collection
                </Button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 11,
                    color: colors.success,
                    padding: '8px 10px',
                    background: colors.successBg,
                    borderRadius: radii.sm,
                  }}
                >
                  <Icon name="check" size={13} />
                  COD fully reconciled
                </div>
              )}
              <div style={{ fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
                Delivery does not mark an order paid. Collection is recorded separately.
              </div>
            </div>
          </Panel>

          <Panel title="Customer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: colors.champagne,
                    color: colors.goldDeep,
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: fonts.display,
                    fontSize: 17,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initials(customer.name)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>{customer.name || 'Customer'}</div>
                  <div style={{ fontSize: 10.5, color: colors.faint }}>
                    {customer.normalizedMobile || customer.mobile || 'No mobile'}
                  </div>
                </div>
              </div>
              <Divider />
              <KeyValue label="Mobile" value={customer.mobile} />
              <KeyValue label="Email" value={customer.email} />
              <KeyValue label="Order-time snapshot" value="Name, mobile and email are preserved from checkout." />
              {customerId ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="users"
                  fullWidth
                  onClick={() => navigate(`/customers/${customerId}`)}
                >
                  Open customer profile
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel title="Delivery address">
            <AddressBlock address={address} />
            {order?.deliverySnapshot ? (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
                <SectionTitle style={{ marginBottom: 10 }}>Delivery snapshot</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <KeyValue label="State" value={order.deliverySnapshot.state} />
                  <KeyValue label="Slab" value={order.deliverySnapshot.slabId || '—'} mono />
                  <KeyValue
                    label="Cart basis"
                    value={formatINR(order.deliverySnapshot.cartValueBasisPaise)}
                  />
                  <KeyValue
                    label="Charge applied"
                    value={formatINR(order.deliverySnapshot.deliveryChargePaise)}
                  />
                </div>
              </div>
            ) : null}
          </Panel>

          {order?.couponSnapshot?.code ? (
            <Panel title="Coupon">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge tone="gold">{order.couponSnapshot.code}</Badge>
                  <span style={{ fontSize: 11, color: colors.muted }}>{order.couponSnapshot.discountType}</span>
                </div>
                <KeyValue label="Discount value" value={order.couponSnapshot.discountValue} />
                <KeyValue label="Discount applied" value={formatINR(order.couponSnapshot.discountPaise)} />
              </div>
            </Panel>
          ) : null}

          <Panel title="Record">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <KeyValue label="Order ID" value={orderId} mono />
              <KeyValue label="Placed" value={formatDateTime(order?.placedAt || order?.createdAt)} />
              <KeyValue label="Accepted" value={formatDateTime(order?.acceptedAt)} />
              <KeyValue label="Shipping" value={formatDateTime(order?.shippedAt)} />
              <KeyValue label="Delivered" value={formatDateTime(order?.deliveredAt)} />
              <KeyValue label="Cancelled" value={formatDateTime(order?.cancelledAt)} />
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={statusOpen}
        onClose={savingStatus ? undefined : () => setStatusOpen(false)}
        title="Update order status"
        subtitle="The backend validates the transition and appends a history entry."
        width={520}
        closeOnBackdrop={!savingStatus}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusOpen(false)} disabled={savingStatus}>
              Cancel
            </Button>
            <Button type="submit" form="order-status-form" loading={savingStatus}>
              Save status
            </Button>
          </>
        }
      >
        <form id="order-status-form" onSubmit={submitStatus} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {statusError ? <Alert tone="error">{statusError}</Alert> : null}
          <Field label="New status" required>
            <Select
              value={statusForm.status}
              onChange={(event) => setStatusForm((state) => ({ ...state, status: event.target.value }))}
            >
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
          {statusForm.status === 'Cancelled' ? (
            <Field label="Cancellation reason" required hint="Recorded permanently in the order history.">
              <Textarea
                rows={3}
                value={statusForm.cancellationReason}
                onChange={(event) => setStatusForm((state) => ({ ...state, cancellationReason: event.target.value }))}
                placeholder="Customer requested cancellation by phone…"
                maxLength={500}
              />
            </Field>
          ) : (
            <Field label="History note" hint="Optional context shown with this transition.">
              <Textarea
                rows={3}
                value={statusForm.note}
                onChange={(event) => setStatusForm((state) => ({ ...state, note: event.target.value }))}
                placeholder="Order accepted and packed…"
                maxLength={500}
              />
            </Field>
          )}
        </form>
      </Modal>

      <Modal
        open={paymentOpen}
        onClose={savingPayment ? undefined : () => setPaymentOpen(false)}
        title="Record COD collection"
        subtitle="Only record this after the cash has been received."
        width={500}
        closeOnBackdrop={!savingPayment}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentOpen(false)} disabled={savingPayment}>
              Cancel
            </Button>
            <Button type="submit" form="order-payment-form" loading={savingPayment}>
              Mark paid
            </Button>
          </>
        }
      >
        <form id="order-payment-form" onSubmit={submitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {paymentError ? <Alert tone="error">{paymentError}</Alert> : null}
          <Field label="Collection method"><Select value={paymentForm.collectionMethod || 'Cash'} onChange={event => setPaymentForm(state => ({ ...state, collectionMethod: event.target.value }))}><option>Cash</option><option>UPI</option><option>Other</option><option>Not recorded</option></Select></Field>
          <Field
            label="Amount collected"
            required
            hint={`Payable amount is ${formatINR(pricing.finalAmountPaise)}. Version 1 records the full amount.`}
          >
            <MoneyInput
              valuePaise={paymentForm.amountCollectedPaise}
              onChangePaise={(amountCollectedPaise) => setPaymentForm((state) => ({ ...state, amountCollectedPaise }))}
            />
          </Field>
          <Field label="Collection note" hint="Optional. Visible only to administrators.">
            <Textarea
              rows={2}
              value={paymentForm.collectionNote}
              onChange={(event) => setPaymentForm((state) => ({ ...state, collectionNote: event.target.value }))}
              placeholder="COD amount collected"
              maxLength={300}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Order invoice"
        subtitle="Review the operational invoice, then print or save as PDF."
        width={760}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInvoiceOpen(false)}>
              Close
            </Button>
            <Button icon="print" onClick={printInvoice}>
              Print invoice
            </Button>
          </>
        }
      >
        <InvoicePreview data={invoiceData} fallback={order} />
      </Modal>
    </PageShell>
  );
}
