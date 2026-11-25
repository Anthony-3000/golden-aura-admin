import { useEffect, useState } from 'react';
import { colors, radii } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDate, formatDateTime, formatINR, toDateTimeInput } from '../lib/format.js';
import { DISCOUNT_TYPES } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import usePaginatedList from '../hooks/usePaginatedList.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import { Field, FormGrid, Input, Select } from '../components/ui/Field.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import MoneyInput from '../components/ui/MoneyInput.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import { Divider, KeyValue, PageShell } from '../components/ui/Media.jsx';

const emptyForm = {
  code: '',
  description: '',
  discountType: 'Percentage',
  discountPercent: '',
  flatPaise: null,
  maxDiscountPaise: null,
  minCartSubtotalPaise: null,
  globalUsageLimit: '',
  perMobileUsageLimit: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

function intOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function discountLabel(coupon) {
  if (coupon.discountType === 'Flat') {
    return `${formatINR(coupon.discountValuePaise ?? coupon.discountValue)} off`;
  }
  const percent = coupon.discountValue ?? coupon.discountPercent ?? 0;
  return `${percent}% off`;
}

function validityLabel(coupon) {
  const from = coupon.startsAt ? formatDate(coupon.startsAt) : 'Anytime';
  const until = coupon.expiresAt ? formatDate(coupon.expiresAt) : 'No expiry';
  return `${from} → ${until}`;
}

export default function Coupons() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const params = { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) };
  const { items, pagination, loading, error, reload } = usePaginatedList(api.coupons.list, params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);

  const [redemptionTarget, setRedemptionTarget] = useState(null);
  const [redemptionPage, setRedemptionPage] = useState(1);
  const [redemptions, setRedemptions] = useState({ items: [], pagination: null, loading: false, error: null });

  useEffect(() => {
    document.title = 'Coupons · Golden Aura Admin';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!redemptionTarget) return undefined;
    let active = true;
    setRedemptions((state) => ({ ...state, loading: true, error: null }));
    api.coupons
      .redemptions(redemptionTarget.id || redemptionTarget._id, { page: redemptionPage, limit: 20 })
      .then((response) => {
        if (!active) return;
        const payload = response.data || {};
        const list = Array.isArray(payload)
          ? payload
          : payload.redemptions || payload.items || [];
        const paginationData = payload.pagination || null;
        setRedemptions({
          items: list,
          pagination: paginationData || {
            page: redemptionPage,
            limit: 20,
            totalItems: list.length,
            totalPages: Math.max(1, Math.ceil(list.length / 20)),
          },
          loading: false,
          error: null,
        });
      })
      .catch((redemptionError) => {
        if (!active) return;
        setRedemptions({ items: [], pagination: null, loading: false, error: redemptionError });
      });
    return () => {
      active = false;
    };
  }, [redemptionTarget, redemptionPage]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'Percentage',
      discountPercent:
        coupon.discountType === 'Percentage'
          ? String(coupon.discountValue ?? coupon.discountPercent ?? '')
          : '',
      flatPaise:
        coupon.discountType === 'Flat'
          ? coupon.discountValuePaise ?? coupon.discountValue ?? null
          : null,
      maxDiscountPaise: coupon.maxDiscountPaise ?? null,
      minCartSubtotalPaise: coupon.minCartSubtotalPaise ?? null,
      globalUsageLimit: coupon.globalUsageLimit ?? '',
      perMobileUsageLimit: coupon.perMobileUsageLimit ?? '',
      startsAt: toDateTimeInput(coupon.startsAt),
      expiresAt: toDateTimeInput(coupon.expiresAt),
      isActive: coupon.isActive ?? true,
    });
    setFormError('');
    setFormOpen(true);
  };

  const set = (patch) => setForm((state) => ({ ...state, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');

    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return setFormError('Use 3–30 characters: letters, numbers, hyphens or underscores.');
    }

    if (form.discountType === 'Percentage') {
      const percent = Number(form.discountPercent);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        return setFormError('Percentage discount must be greater than 0 and at most 100.');
      }
    } else if (!form.flatPaise || form.flatPaise <= 0) {
      return setFormError('Enter a flat discount amount greater than zero.');
    }

    if (form.startsAt && form.expiresAt && new Date(form.startsAt) >= new Date(form.expiresAt)) {
      return setFormError('The expiry must be after the start date.');
    }

    const payload = {
      code,
      description: form.description.trim(),
      discountType: form.discountType,
      minCartSubtotalPaise: form.minCartSubtotalPaise,
      globalUsageLimit: intOrNull(form.globalUsageLimit),
      perMobileUsageLimit: intOrNull(form.perMobileUsageLimit),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive,
    };

    if (form.discountType === 'Percentage') {
      payload.discountValue = Number(form.discountPercent);
      payload.maxDiscountPaise = form.maxDiscountPaise;
    } else {
      payload.discountValuePaise = form.flatPaise;
      payload.maxDiscountPaise = null;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.coupons.update(editing.id || editing._id, payload);
        toast.success('Coupon updated.');
      } else {
        await api.coupons.create(payload);
        toast.success('Coupon created.');
      }
      setFormOpen(false);
      reload();
    } catch (saveError) {
      setFormError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon) => {
    const couponId = coupon.id || coupon._id;
    setStatusBusy(couponId);
    try {
      await api.coupons.setStatus(couponId, !coupon.isActive);
      toast.success(`${coupon.code} is now ${!coupon.isActive ? 'active' : 'inactive'}.`);
      reload();
    } catch (statusError) {
      toast.error(statusError.message);
    } finally {
      setStatusBusy(null);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Coupon',
      render: (coupon) => (
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 8px',
              borderRadius: 5,
              background: colors.champagne,
              border: '1px solid #EBD9B8',
              color: colors.goldDeep,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.8,
            }}
          >
            {coupon.code}
          </span>
          {coupon.description ? (
            <div
              style={{
                fontSize: 10.5,
                color: colors.muted,
                marginTop: 4,
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {coupon.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (coupon) => (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>{discountLabel(coupon)}</div>
          {coupon.discountType === 'Percentage' && coupon.maxDiscountPaise ? (
            <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
              capped at {formatINR(coupon.maxDiscountPaise)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'minimum',
      header: 'Minimum cart',
      render: (coupon) => (
        <span style={{ fontSize: 11.5, color: colors.muted }}>
          {coupon.minCartSubtotalPaise ? formatINR(coupon.minCartSubtotalPaise) : 'None'}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (coupon) => {
        const used = coupon.usageCount ?? coupon.redemptionCount ?? 0;
        return (
          <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.5 }}>
            <div>
              {used} {coupon.globalUsageLimit ? `/ ${coupon.globalUsageLimit}` : 'used'}
            </div>
            <div style={{ fontSize: 10.5, color: colors.faint }}>
              {coupon.perMobileUsageLimit ? `${coupon.perMobileUsageLimit} per mobile` : 'No per-mobile cap'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'validity',
      header: 'Validity',
      render: (coupon) => (
        <span style={{ fontSize: 10.5, color: colors.muted, lineHeight: 1.5 }}>{validityLabel(coupon)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (coupon) => (
        <Toggle
          checked={Boolean(coupon.isActive)}
          onChange={() => toggleStatus(coupon)}
          disabled={statusBusy === (coupon.id || coupon._id)}
          size="sm"
          label={coupon.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 96,
      render: (coupon) => (
        <TableActions>
          <IconButton icon="edit" label="Edit coupon" onClick={() => openEdit(coupon)} />
          <IconButton
            icon="eye"
            label="View redemptions"
            onClick={() => {
              setRedemptionPage(1);
              setRedemptionTarget(coupon);
            }}
          />
        </TableActions>
      ),
    },
  ];

  const redemptionColumns = [
    {
      key: 'order',
      header: 'Order',
      render: (redemption) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>
            {redemption.order?.orderNumber || redemption.orderNumber || redemption.order || '—'}
          </div>
          <div style={{ fontSize: 10, color: colors.faint, marginTop: 2 }}>
            {formatDateTime(redemption.redeemedAt || redemption.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (redemption) => (
        <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.5 }}>
          <div>{redemption.normalizedMobile || redemption.customerSnapshot?.mobile || '—'}</div>
          <div style={{ fontSize: 10.5, color: colors.faint }}>
            {redemption.customer?.name || redemption.customerSnapshot?.name || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      align: 'right',
      render: (redemption) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>
          {formatINR(redemption.discountPaise)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (redemption) => <StatusBadge status={redemption.status || 'Redeemed'} />,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Commerce"
        title="Coupons"
        subtitle="Percentage and flat discounts with optional caps, minimum cart values, validity windows and usage limits."
        actions={
          <>
            <Badge tone="gold" dot={false}>{pagination.totalItems} coupons</Badge>
            <Button icon="plus" onClick={openCreate}>
              New coupon
            </Button>
          </>
        }
      />

      <Panel bare>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            padding: '16px 18px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search coupon code or description…"
            style={{ maxWidth: 360 }}
          />
          <Button size="sm" variant="ghost" icon="refresh" onClick={reload} loading={loading}>
            Refresh
          </Button>
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Coupons could not be loaded"
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
          minWidth={1000}
          rowKey={(coupon) => coupon.id || coupon._id}
          empty={
            !loading ? (
              <EmptyState
                icon="ticket"
                title={search ? 'No coupons match this search' : 'No coupons yet'}
                description={
                  search
                    ? 'Try another code or clear the search.'
                    : 'Create a welcome offer, a seasonal percentage discount or a flat campaign.'
                }
                action={
                  search ? (
                    <Button size="sm" variant="secondary" onClick={() => setSearch('')}>Clear search</Button>
                  ) : (
                    <Button size="sm" icon="plus" onClick={openCreate}>Create the first coupon</Button>
                  )
                }
              />
            ) : null
          }
          footer={<div style={{ padding: '0 16px' }}><Pagination {...pagination} onChange={setPage} /></div>}
        />
      </Panel>

      <div style={{ marginTop: 14, fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
        Coupons are validated and discounted on the backend. A coupon is counted as redeemed only when an order is
        successfully created, and cancellation does not automatically release usage in Version 1.
      </div>

      <Modal
        open={formOpen}
        onClose={saving ? undefined : () => setFormOpen(false)}
        title={editing ? 'Edit coupon' : 'New coupon'}
        subtitle={
          editing
            ? 'Editing changes future redemptions. Historical order coupon snapshots are preserved.'
            : 'Configure the offer, its guardrails and its validity window.'
        }
        width={700}
        closeOnBackdrop={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="coupon-form" loading={saving}>
              {editing ? 'Save changes' : 'Create coupon'}
            </Button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
          {formError ? <Alert tone="error">{formError}</Alert> : null}

          <FormGrid>
            <Field label="Coupon code" required hint="Letters, numbers, hyphens and underscores. Stored uppercase.">
              <Input
                value={form.code}
                onChange={(event) => set({ code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                placeholder="AURA10"
                maxLength={30}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: 1 }}
              />
            </Field>
            <Field label="Campaign description" hint="Internal name or customer-facing description.">
              <Input
                value={form.description}
                onChange={(event) => set({ description: event.target.value })}
                placeholder="Festive 10 percent"
                maxLength={200}
              />
            </Field>
          </FormGrid>

          <Divider />

          <FormGrid>
            <Field label="Discount type" required>
              <Select value={form.discountType} onChange={(event) => set({ discountType: event.target.value })}>
                {DISCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
            {form.discountType === 'Percentage' ? (
              <Field label="Percentage off" required hint="A value between 0 and 100.">
                <div style={{ position: 'relative' }}>
                  <Input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={form.discountPercent}
                    onChange={(event) => set({ discountPercent: event.target.value })}
                    placeholder="10"
                    style={{ paddingRight: 34 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 13,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 13,
                      color: colors.muted,
                      pointerEvents: 'none',
                    }}
                  >
                    %
                  </span>
                </div>
              </Field>
            ) : (
              <Field label="Flat discount" required>
                <MoneyInput
                  valuePaise={form.flatPaise}
                  onChangePaise={(flatPaise) => set({ flatPaise })}
                  placeholder="100"
                />
              </Field>
            )}
          </FormGrid>

          <FormGrid>
            {form.discountType === 'Percentage' ? (
              <Field label="Maximum discount" hint="Optional cap in rupees. Leave blank for no cap.">
                <MoneyInput
                  valuePaise={form.maxDiscountPaise}
                  onChangePaise={(maxDiscountPaise) => set({ maxDiscountPaise })}
                  placeholder="200"
                />
              </Field>
            ) : (
              <Field label="Maximum discount" hint="Not applicable to flat coupons.">
                <div
                  style={{
                    padding: '11px 13px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.md,
                    background: colors.bgAlt,
                    fontSize: 12,
                    color: colors.faint,
                  }}
                >
                  Flat coupon
                </div>
              </Field>
            )}
            <Field label="Minimum cart subtotal" hint="Optional. Eligibility is checked before delivery.">
              <MoneyInput
                valuePaise={form.minCartSubtotalPaise}
                onChangePaise={(minCartSubtotalPaise) => set({ minCartSubtotalPaise })}
                placeholder="500"
              />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Global usage limit" hint="Optional. Total redemptions across all customers.">
              <Input
                type="number"
                min="1"
                step="1"
                value={form.globalUsageLimit}
                onChange={(event) => set({ globalUsageLimit: event.target.value })}
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Per-mobile limit" hint="Optional. Redemptions allowed per mobile number.">
              <Input
                type="number"
                min="1"
                step="1"
                value={form.perMobileUsageLimit}
                onChange={(event) => set({ perMobileUsageLimit: event.target.value })}
                placeholder="Unlimited"
              />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field label="Starts at" hint="Leave blank to make it valid immediately.">
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => set({ startsAt: event.target.value })}
              />
            </Field>
            <Field label="Expires at" hint="Leave blank for no expiry.">
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => set({ expiresAt: event.target.value })}
              />
            </Field>
          </FormGrid>

          <Field label="Availability" hint="Inactive coupons remain on record but cannot be redeemed.">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
                background: colors.bgAlt,
              }}
            >
              <span style={{ fontSize: 12, color: colors.inkSoft }}>
                {form.isActive ? 'Active and redeemable' : 'Inactive'}
              </span>
              <Toggle checked={form.isActive} onChange={(isActive) => set({ isActive })} />
            </div>
          </Field>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Divider />
              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                <KeyValue label="Redemptions" value={editing.usageCount ?? editing.redemptionCount ?? 0} />
                <KeyValue label="Created" value={formatDateTime(editing.createdAt)} />
                <KeyValue label="Last updated" value={formatDateTime(editing.updatedAt)} />
              </div>
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(redemptionTarget)}
        onClose={() => setRedemptionTarget(null)}
        title={redemptionTarget ? `Redemptions · ${redemptionTarget.code}` : 'Redemptions'}
        subtitle="Usage records are admin-only and retain the mobile snapshot from checkout."
        width={760}
        footer={
          <Button variant="secondary" onClick={() => setRedemptionTarget(null)}>
            Close
          </Button>
        }
      >
        {redemptions.error ? (
          <Alert
            tone="error"
            title="Redemptions could not be loaded"
            action={
              <Button
                size="sm"
                variant="secondary"
                icon="refresh"
                onClick={() => {
                  setRedemptionPage(1);
                  setRedemptionTarget((target) => (target ? { ...target } : target));
                }}
              >
                Retry
              </Button>
            }
          >
            {redemptions.error.message}
          </Alert>
        ) : (
          <DataTable
            columns={redemptionColumns}
            rows={redemptions.items}
            loading={redemptions.loading}
            minWidth={560}
            rowKey={(redemption) => redemption.id || redemption._id}
            empty={
              !redemptions.loading ? (
                <EmptyState
                  compact
                  icon="ticket"
                  title="No redemptions yet"
                  description="This coupon has not been used on a successful order."
                />
              ) : null
            }
            footer={
              redemptions.pagination ? (
                <Pagination {...redemptions.pagination} onChange={setRedemptionPage} />
              ) : null
            }
          />
        )}
      </Modal>
    </PageShell>
  );
}
