import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fonts, radii } from '../lib/theme.js';
import { api, extractList } from '../lib/api.js';
import { formatINR } from '../lib/format.js';
import { INDIAN_STATES } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import MoneyInput from '../components/ui/MoneyInput.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { Divider, KeyValue, PageShell, SectionTitle } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

const DEFAULT_SLABS = [
  { slabId: 'standard', minCartValuePaise: 0, maxCartValuePaise: 59899, deliveryChargePaise: 5000, isActive: true },
  { slabId: 'free', minCartValuePaise: 59900, maxCartValuePaise: null, deliveryChargePaise: 0, isActive: true },
];

const emptySlab = () => ({
  slabId: newSlabId(),
  minCartValuePaise: null,
  maxCartValuePaise: null,
  deliveryChargePaise: null,
  isActive: true,
});

const emptyZone = () => ({
  id: null,
  name: '',
  prefixesText: '',
  isActive: true,
  slabs: DEFAULT_SLABS.map((slab) => ({ ...slab })),
});

function newSlabId() {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `slab-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

function slabRange(slab) {
  const min = formatINR(slab.minCartValuePaise);
  if (slab.maxCartValuePaise === null || slab.maxCartValuePaise === undefined) return `${min} and above`;
  return `${min} – ${formatINR(slab.maxCartValuePaise)}`;
}

function validateSlabFields(slab) {
  if (!Number.isInteger(slab.minCartValuePaise) || slab.minCartValuePaise < 0) return 'Every slab needs a valid minimum cart value.';
  if (!Number.isInteger(slab.deliveryChargePaise) || slab.deliveryChargePaise < 0) return 'Every slab needs a valid delivery charge. Enter 0 for free delivery.';
  if (
    slab.maxCartValuePaise !== null &&
    slab.maxCartValuePaise !== undefined &&
    (!Number.isInteger(slab.maxCartValuePaise) || slab.maxCartValuePaise < slab.minCartValuePaise)
  ) {
    return 'A slab maximum cannot be lower than its minimum.';
  }
  return '';
}

/** Mirrors the backend's slab rules so mistakes are caught before saving. */
function validateSlabs(slabs) {
  if (!Array.isArray(slabs) || !slabs.length) return 'Add at least one cart-value slab.';
  for (const slab of slabs) {
    const fieldError = validateSlabFields(slab);
    if (fieldError) return fieldError;
  }

  const active = slabs
    .filter((slab) => slab.isActive !== false)
    .slice()
    .sort((a, b) => a.minCartValuePaise - b.minCartValuePaise);

  if (!active.length) return 'Keep at least one slab active. Checkout needs a charge for every cart value.';
  if (active[0].minCartValuePaise !== 0) return 'The first active slab must start at ₹0.';
  for (let index = 0; index < active.length; index += 1) {
    const current = active[index];
    const next = active[index + 1];
    if (current.maxCartValuePaise == null && next) return 'Only the last active slab can have no upper limit.';
    if (next && current.maxCartValuePaise + 1 !== next.minCartValuePaise) {
      return 'Active slabs must touch without gaps or overlaps.';
    }
  }
  if (active[active.length - 1].maxCartValuePaise != null) return 'The final active slab must leave its maximum blank.';
  return '';
}

function SlabLadder({ slabs }) {
  const active = slabs.filter((slab) => slab.isActive !== false).sort((a, b) => a.minCartValuePaise - b.minCartValuePaise);
  if (!active.length) {
    return (
      <div style={{ padding: '16px 18px', border: `1px dashed ${colors.borderStrong}`, borderRadius: radii.md, background: colors.bgAlt }}>
        <span style={{ fontSize: 12, color: colors.muted }}>No active slabs yet. Add one to define a delivery charge.</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, flexWrap: 'wrap' }}>
      {active.map((slab, index) => {
        const free = Number(slab.deliveryChargePaise) === 0;
        return (
          <div key={slab.slabId} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 190px', minWidth: 0 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                padding: '12px 14px',
                borderRadius: radii.md,
                border: `1px solid ${free ? '#CFE1D2' : colors.border}`,
                background: free ? colors.successBg : colors.champagne,
              }}
            >
              <div style={{ fontSize: 9.5, letterSpacing: 1.1, textTransform: 'uppercase', color: free ? colors.success : colors.goldDeep, fontWeight: 600 }}>
                {index === 0 ? 'From the first rupee' : `Step ${index + 1}`}
              </div>
              <div style={{ fontSize: 12, color: colors.inkSoft, marginTop: 5 }}>{slabRange(slab)}</div>
              <div style={{ fontSize: 17, fontFamily: fonts.display, fontWeight: 600, marginTop: 6, color: free ? colors.success : colors.ink }}>
                {free ? 'Free delivery' : formatINR(slab.deliveryChargePaise)}
              </div>
            </div>
            {index < active.length - 1 ? <Icon name="arrowRight" size={14} style={{ color: colors.faint }} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function SlabEditor({ value, onChange, error, compact = false }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 13px',
          background: colors.bgAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: radii.md,
        }}
      >
        <Icon name="pin" size={15} style={{ color: colors.gold }} />
        <span style={{ fontSize: 12, color: colors.inkSoft }}>
          {value.minCartValuePaise === null ? 'From ₹—' : `From ${formatINR(value.minCartValuePaise)}`}
          {'  →  '}
          {value.maxCartValuePaise == null ? 'and above' : formatINR(value.maxCartValuePaise)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <Field label="Minimum cart value" required hint={compact ? undefined : 'Inclusive lower bound.'}>
          <MoneyInput
            valuePaise={value.minCartValuePaise}
            onChangePaise={(minCartValuePaise) => set({ minCartValuePaise })}
            placeholder="0"
          />
        </Field>
        <Field label="Maximum cart value" hint={compact ? undefined : 'Leave blank for the final, open-ended slab.'}>
          <MoneyInput
            valuePaise={value.maxCartValuePaise}
            onChangePaise={(maxCartValuePaise) => set({ maxCartValuePaise })}
            placeholder="No limit"
          />
        </Field>
      </div>

      <Field label="Delivery charge" required hint={compact ? undefined : 'Enter 0 for free delivery.'}>
        <MoneyInput
          valuePaise={value.deliveryChargePaise}
          onChangePaise={(deliveryChargePaise) => set({ deliveryChargePaise })}
          placeholder="50"
        />
      </Field>

      <Field label="Slab status" hint={compact ? undefined : 'Paused slabs stay on record but checkout ignores them.'}>
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
          <span style={{ fontSize: 12, color: colors.inkSoft }}>{value.isActive ? 'Active' : 'Paused'}</span>
          <Toggle checked={value.isActive} onChange={(isActive) => set({ isActive })} />
        </div>
      </Field>

      {compact ? null : (
        <div style={{ fontSize: 11, color: colors.faint, lineHeight: 1.6 }}>
          Active slabs must form one continuous range from ₹0. The highest slab may stay open-ended.
        </div>
      )}
    </div>
  );
}

export default function StateDelivery() {
  const { stateCode } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const code = String(stateCode || '').toUpperCase();
  const canonical = useMemo(() => INDIAN_STATES.find((state) => state.code === code), [code]);

  const [config, setConfig] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [saving, setSaving] = useState(false);

  const [zones, setZones] = useState([]);
  const [zoneModal, setZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState(emptyZone());
  const [zoneError, setZoneError] = useState('');
  const [deleteZoneTarget, setDeleteZoneTarget] = useState(null);

  const [slabModal, setSlabModal] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);
  const [slabForm, setSlabForm] = useState(emptySlab());
  const [slabError, setSlabError] = useState('');
  const [deleteSlabTarget, setDeleteSlabTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.delivery.get(code).catch((loadError) => {
        if (loadError.status !== 404) throw loadError;
        return null;
      }),
      api.delivery.zones.list({ stateCode: code, page: 1, limit: 100 }),
    ])
      .then(([stateResponse, zoneResponse]) => {
        const data = stateResponse?.data?.state || stateResponse?.data?.config || stateResponse?.data;
        setConfig({
          stateName: data?.stateName || canonical?.name || code,
          stateCode: data?.stateCode || code,
          isDeliveryEnabled: Boolean(data?.isDeliveryEnabled),
          slabs: Array.isArray(data?.slabs)
            ? data.slabs.map((slab) => ({ ...slab }))
            : DEFAULT_SLABS.map((slab) => ({ ...slab })),
        });
        setIsNew(!data);
        setZones(extractList(zoneResponse.data).items);
        setError(null);
      })
      .catch((loadError) => setError(loadError))
      .finally(() => setLoading(false));
  };

  useEffect(load, [code]);

  useEffect(() => {
    document.title = `${canonical?.name || code} delivery · Golden Aura Admin`;
  }, [canonical, code]);

  const slabs = useMemo(
    () =>
      (config?.slabs || [])
        .slice()
        .sort((a, b) => Number(a.minCartValuePaise) - Number(b.minCartValuePaise)),
    [config],
  );
  const activeSlabs = slabs.filter((slab) => slab.isActive !== false);
  const freeDelivery = activeSlabs.some((slab) => Number(slab.deliveryChargePaise) === 0);
  const freeThreshold = activeSlabs.find((slab) => Number(slab.deliveryChargePaise) === 0);

  const toggleEnabled = async () => {
    if (!config) return;
    setBusy('status');
    try {
      if (isNew) {
        await api.delivery.upsert(code, {
          stateName: config.stateName,
          isDeliveryEnabled: !config.isDeliveryEnabled,
          slabs: config.slabs,
        });
      } else {
        await api.delivery.setStatus(code, !config.isDeliveryEnabled);
      }
      toast.success(`Delivery in ${config.stateName} is now ${!config.isDeliveryEnabled ? 'enabled' : 'disabled'}.`);
      load();
    } catch (statusError) {
      toast.error(statusError.message);
    } finally {
      setBusy(null);
    }
  };

  const openAddSlab = () => {
    setEditingSlab(null);
    setSlabForm(emptySlab());
    setSlabError('');
    setSlabModal(true);
  };

  const openEditSlab = (slab) => {
    setEditingSlab(slab);
    setSlabForm({
      slabId: slab.slabId,
      minCartValuePaise: slab.minCartValuePaise ?? null,
      maxCartValuePaise: slab.maxCartValuePaise ?? null,
      deliveryChargePaise: slab.deliveryChargePaise ?? null,
      isActive: slab.isActive !== false,
    });
    setSlabError('');
    setSlabModal(true);
  };

  const submitSlab = async (event) => {
    event.preventDefault();
    setSlabError('');
    const payload = {
      slabId: slabForm.slabId,
      minCartValuePaise: slabForm.minCartValuePaise,
      maxCartValuePaise: slabForm.maxCartValuePaise ?? null,
      deliveryChargePaise: slabForm.deliveryChargePaise,
      isActive: Boolean(slabForm.isActive),
    };

    const fieldError = validateSlabFields(payload);
    if (fieldError) return setSlabError(fieldError);

    const candidate = editingSlab
      ? slabs.map((slab) => (slab.slabId === editingSlab.slabId ? payload : slab))
      : [...slabs, payload];
    const candidateError = validateSlabs(candidate);
    if (candidateError) return setSlabError(candidateError);

    setSaving(true);
    try {
      if (isNew) {
        await api.delivery.upsert(code, {
          stateName: config.stateName,
          isDeliveryEnabled: config.isDeliveryEnabled,
          slabs: candidate,
        });
        toast.success('State delivery rule created.');
      } else if (editingSlab) {
        await api.delivery.updateSlab(code, editingSlab.slabId, payload);
        toast.success('Slab updated.');
      } else {
        await api.delivery.addSlab(code, payload);
        toast.success('Delivery slab added.');
      }
      setSlabModal(false);
      load();
    } catch (slabFailure) {
      setSlabError(slabFailure.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSlab = async (slab) => {
    const next = slab.isActive === false;
    const candidate = slabs.map((row) => (row.slabId === slab.slabId ? { ...row, isActive: next } : row));
    const candidateError = validateSlabs(candidate);
    if (candidateError) {
      toast.error(candidateError);
      return;
    }
    if (isNew) {
      setConfig((current) => ({ ...current, slabs: candidate }));
      return;
    }
    setBusy(slab.slabId);
    try {
      await api.delivery.updateSlab(code, slab.slabId, { isActive: next });
      toast.success(next ? 'Slab activated.' : 'Slab paused.');
      load();
    } catch (toggleError) {
      toast.error(toggleError.message);
    } finally {
      setBusy(null);
    }
  };

  const removeSlab = async () => {
    const target = deleteSlabTarget;
    if (!target) return;
    const candidate = slabs.filter((slab) => slab.slabId !== target.slabId);
    const candidateError = validateSlabs(candidate);
    if (candidateError) {
      toast.error(candidateError);
      setDeleteSlabTarget(null);
      return;
    }
    setDeleting(true);
    try {
      if (isNew) {
        setConfig((current) => ({ ...current, slabs: candidate }));
      } else {
        await api.delivery.removeSlab(code, target.slabId);
      }
      toast.success('Slab removed.');
      setDeleteSlabTarget(null);
      if (!isNew) load();
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };
  const [deleting, setDeleting] = useState(false);

  const openAddZone = () => {
    setZoneForm(emptyZone());
    setZoneError('');
    setZoneModal(true);
  };

  const openEditZone = (zone) => {
    setZoneForm({
      id: zone._id || zone.id,
      name: zone.name || '',
      prefixesText: (zone.pincodePrefixes || []).join(', '),
      isActive: zone.isActive !== false,
      slabs: (zone.slabs || []).map((slab) => ({ ...slab })),
    });
    setZoneError('');
    setZoneModal(true);
  };

  const submitZone = async (event) => {
    event.preventDefault();
    setZoneError('');
    const name = zoneForm.name.trim();
    if (!name) return setZoneError('Give this zone a name, such as “Kanpur”.');

    const prefixes = zoneForm.prefixesText
      .split(/[\s,]+/)
      .map((prefix) => prefix.trim())
      .filter(Boolean);
    if (!prefixes.length || prefixes.some((prefix) => !/^\d{3}$/.test(prefix)) || new Set(prefixes).size !== prefixes.length) {
      return setZoneError('Enter unique three-digit pincode prefixes, separated by commas or spaces.');
    }

    const slabError = validateSlabs(zoneForm.slabs);
    if (slabError) return setZoneError(slabError);

    const payload = {
      stateCode: code,
      name,
      pincodePrefixes: prefixes,
      isActive: Boolean(zoneForm.isActive),
      slabs: zoneForm.slabs.map((slab) => ({
        slabId: slab.slabId,
        minCartValuePaise: slab.minCartValuePaise,
        maxCartValuePaise: slab.maxCartValuePaise ?? null,
        deliveryChargePaise: slab.deliveryChargePaise,
        isActive: Boolean(slab.isActive),
      })),
    };

    setSaving(true);
    try {
      if (zoneForm.id) {
        await api.delivery.zones.update(zoneForm.id, payload);
        toast.success('Area override updated.');
      } else {
        await api.delivery.zones.create(payload);
        toast.success('Area override created.');
      }
      setZoneModal(false);
      load();
    } catch (zoneFailure) {
      setZoneError(zoneFailure.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleZone = async (zone) => {
    setBusy(zone._id);
    try {
      await api.delivery.zones.setStatus(zone._id, zone.isActive === false);
      toast.success(zone.isActive === false ? 'Area override activated.' : 'Area override paused.');
      load();
    } catch (zoneErrorResponse) {
      toast.error(zoneErrorResponse.message);
    } finally {
      setBusy(null);
    }
  };

  const confirmDeleteZone = async () => {
    if (!deleteZoneTarget) return;
    setDeleting(true);
    try {
      await api.delivery.zones.remove(deleteZoneTarget._id);
      toast.success('Area override deleted.');
      setDeleteZoneTarget(null);
      load();
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const zoneSlabsEditor = (index, value) =>
    setZoneForm((current) => ({
      ...current,
      slabs: current.slabs.map((slab, position) => (position === index ? value : slab)),
    }));

  const slabColumns = [
    {
      key: 'range',
      header: 'Cart value',
      render: (slab) => (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>{slabRange(slab)}</div>
          <div style={{ fontSize: 10, color: colors.faint, marginTop: 3, fontFamily: 'ui-monospace, monospace' }}>
            {slab.slabId}
          </div>
        </div>
      ),
    },
    {
      key: 'charge',
      header: 'Delivery charge',
      align: 'right',
      render: (slab) => {
        const free = Number(slab.deliveryChargePaise) === 0;
        return (
          <span style={{ fontSize: 13, fontWeight: free ? 600 : 500, color: free ? colors.success : colors.ink }}>
            {free ? 'Free' : formatINR(slab.deliveryChargePaise)}
          </span>
        );
      },
    },
    {
      key: 'active',
      header: 'Status',
      render: (slab) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Toggle
            checked={slab.isActive !== false}
            onChange={() => toggleSlab(slab)}
            disabled={busy === slab.slabId}
            size="sm"
            label={slab.isActive !== false ? 'Active' : 'Paused'}
          />
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 92,
      render: (slab) => (
        <TableActions>
          <IconButton icon="edit" label="Edit slab" onClick={() => openEditSlab(slab)} />
          <IconButton icon="trash" label="Delete slab" tone="danger" onClick={() => setDeleteSlabTarget(slab)} />
        </TableActions>
      ),
    },
  ];

  if (loading && !config) return <PageLoader label="Opening delivery rules…" />;

  if (error && !config) {
    return (
      <PageShell>
        <PageHeader eyebrow="Delivery rule" title={canonical?.name || code} />
        <Alert
          tone="error"
          title="This state configuration could not be loaded"
          action={
            <Button size="sm" variant="secondary" icon="arrowLeft" onClick={() => navigate('/delivery')}>
              Back to delivery
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
        eyebrow="Delivery rule"
        title={config?.stateName || canonical?.name || code}
        subtitle={
          <span>
            <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: 1 }}>{config?.stateCode || code}</span>
            {' · '}
            {config?.isDeliveryEnabled ? 'Checkout is open in this state' : 'Checkout is blocked in this state'}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon="arrowLeft" onClick={() => navigate('/delivery')}>
              All states
            </Button>
            <Button icon="plus" onClick={openAddZone} disabled={isNew}>
              Add area override
            </Button>
          </>
        }
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <Badge tone={isNew ? 'warning' : config.isDeliveryEnabled ? 'success' : 'neutral'}>
          {isNew ? 'Not configured yet' : config.isDeliveryEnabled ? 'Serviceable' : 'Not serviceable'}
        </Badge>
        <Badge tone="gold">{activeSlabs.length} active {activeSlabs.length === 1 ? 'slab' : 'slabs'}</Badge>
        <Badge tone={zones.length ? 'info' : 'neutral'}>{zones.length} {zones.length === 1 ? 'override' : 'overrides'}</Badge>
      </div>

      {isNew ? (
        <Alert tone="info" title="Start with the default pricing" style={{ marginBottom: 18 }}>
          We have prepared a two-step rule for this state. Edit it if needed, then switch on delivery once it looks right.
          The rule is created the first time you save or enable it.
        </Alert>
      ) : null}

      <div
        className="ga-delivery-detail-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(290px, 0.8fr)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <style>{'@media (max-width: 1050px){ .ga-delivery-detail-grid { grid-template-columns: 1fr !important; } }'}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <Panel
            title="Default cart pricing"
            subtitle="Applies to every valid pincode in this state unless an area override matches."
            action={
              <Button size="sm" variant="ghost" icon="refresh" onClick={load} loading={loading}>
                Refresh
              </Button>
            }
          >
            <SlabLadder slabs={slabs} />
            <div style={{ height: 1, background: colors.border, margin: '20px 0 4px' }} />
          </Panel>

          <Panel
            title="Cart-value slabs"
            subtitle="Active slabs must cover one continuous range from ₹0. Zero charge means free delivery."
            padding={0}
            action={<Button size="sm" variant="secondary" icon="plus" onClick={openAddSlab}>Add slab</Button>}
          >
            <DataTable
              columns={slabColumns}
              rows={slabs}
              loading={loading}
              minWidth={620}
              rowKey={(slab) => slab.slabId}
              empty={
                !loading ? (
                  <EmptyState
                    icon="truck"
                    title="No slabs yet"
                    description="Start with a slab at ₹0 so every order has a defined delivery charge."
                    action={<Button size="sm" icon="plus" onClick={openAddSlab}>Add the first slab</Button>}
                  />
                ) : null
              }
            />
            {slabs.length ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  borderTop: `1px solid ${colors.border}`,
                  background: '#FCF9F4',
                  fontSize: 11,
                  color: colors.faint,
                  lineHeight: 1.5,
                }}
              >
                <Icon name="sparkle" size={13} style={{ color: colors.gold }} />
                The backend rechecks gaps, overlaps and coverage whenever pricing is saved.
              </div>
            ) : null}
          </Panel>

          <Panel
            title="Area overrides"
            subtitle="A zone changes the price for pincode prefixes that match it. The state rule applies everywhere else."
            padding={0}
            action={
              <Button size="sm" variant="secondary" icon="plus" onClick={openAddZone} disabled={isNew}>
                Add zone
              </Button>
            }
          >
            {zones.length ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {zones.map((zone) => (
                  <div
                    key={zone._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      flexWrap: 'wrap',
                      padding: '15px 18px',
                      borderBottom: `1px solid #F3ECE1`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>{zone.name}</span>
                        <Badge tone={zone.isActive ? 'success' : 'neutral'}>
                          {zone.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {(zone.pincodePrefixes || []).map((prefix) => (
                          <span
                            key={prefix}
                            style={{
                              padding: '2px 7px',
                              borderRadius: 5,
                              background: colors.cream,
                              color: colors.inkSoft,
                              fontSize: 10.5,
                              fontFamily: 'ui-monospace, monospace',
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {prefix}***
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
                        {zone.slabs?.filter((slab) => slab.isActive !== false).length || 0} active slabs ·{' '}
                        {zone.slabs?.some((slab) => slab.isActive !== false && Number(slab.deliveryChargePaise) === 0)
                          ? 'includes free delivery'
                          : 'paid delivery'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span onClick={(event) => event.stopPropagation()}>
                        <Toggle
                          checked={zone.isActive !== false}
                          onChange={() => toggleZone(zone)}
                          disabled={busy === zone._id}
                          size="sm"
                          label={zone.isActive !== false ? 'On' : 'Off'}
                        />
                      </span>
                      <IconButton icon="edit" label={`Edit ${zone.name}`} onClick={() => openEditZone(zone)} />
                      <IconButton icon="trash" label={`Delete ${zone.name}`} tone="danger" onClick={() => setDeleteZoneTarget(zone)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="layers"
                title="No area overrides"
                description="Use a zone only when part of this state needs different delivery pricing, such as a free-delivery pincode group."
                action={
                  <Button size="sm" variant="secondary" icon="plus" onClick={openAddZone} disabled={isNew}>
                    Add an area override
                  </Button>
                }
              />
            )}
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="State settings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>Accept delivery</div>
                  <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 3 }}>
                    {config.isDeliveryEnabled ? 'Customers can check out' : 'Checkout is blocked here'}
                  </div>
                </div>
                <Toggle
                  checked={Boolean(config.isDeliveryEnabled)}
                  onChange={toggleEnabled}
                  disabled={busy === 'status' || (!config.isDeliveryEnabled && activeSlabs.length === 0)}
                  label={config.isDeliveryEnabled ? 'Enabled' : 'Disabled'}
                />
              </div>
              {!config.isDeliveryEnabled && activeSlabs.length === 0 ? (
                <div style={{ fontSize: 11, color: colors.warning, lineHeight: 1.5 }}>
                  Add at least one active slab before enabling delivery.
                </div>
              ) : null}
              <Divider />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <KeyValue label="State code" value={config.stateCode || code} mono />
                <KeyValue label="Cart slabs" value={`${activeSlabs.length} active / ${slabs.length} total`} />
                <KeyValue label="Free delivery" value={freeDelivery ? 'Included' : 'Not offered'} />
                {freeDelivery && freeThreshold ? (
                  <KeyValue label="Free from" value={`${slabRange(freeThreshold).split(' – ')[0]} onwards`} />
                ) : null}
                <KeyValue label="Area overrides" value={zones.length} />
              </div>
            </div>
          </Panel>

          <Panel bare>
            <div style={{ padding: 20, background: colors.champagne }}>
              <SectionTitle note="Rule">What happens at checkout</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
                {[
                  ['Pincode lookup', 'The master list identifies the state.'],
                  ['State check', 'If delivery is off, checkout stops here.'],
                  ['Zone match', 'A matching active zone wins over the state default.'],
                  ['Slab match', 'The merchandise subtotal selects the charge.'],
                ].map(([label, detail], index) => (
                  <div key={label} style={{ display: 'flex', gap: 10 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: colors.surface,
                        border: `1px solid ${colors.borderStrong}`,
                        color: colors.goldDeep,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 9.5,
                        fontFamily: 'ui-monospace, monospace',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: 11.5, color: colors.ink, fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: 10.5, color: colors.muted, marginTop: 2, lineHeight: 1.5 }}>{detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 15, paddingTop: 13, borderTop: `1px solid #E8D5B3`, fontSize: 10.5, color: colors.muted, lineHeight: 1.6 }}>
                Prefixes are three digits. For example, <span style={{ fontFamily: 'ui-monospace, monospace' }}>208</span> matches{' '}
                <span style={{ fontFamily: 'ui-monospace, monospace' }}>208001</span> and other pincodes beginning with 208.
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={slabModal}
        onClose={saving ? undefined : () => setSlabModal(false)}
        title={editingSlab ? 'Edit delivery slab' : 'New delivery slab'}
        subtitle="Cart values are compared against the merchandise subtotal before coupon discount."
        width={560}
        closeOnBackdrop={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSlabModal(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="slab-form" loading={saving}>
              {editingSlab ? 'Save slab' : 'Add slab'}
            </Button>
          </>
        }
      >
        <form id="slab-form" onSubmit={submitSlab}>
          <SlabEditor value={slabForm} onChange={setSlabForm} error={slabError} />
        </form>
      </Modal>

      <Modal
        open={zoneModal}
        onClose={saving ? undefined : () => setZoneModal(false)}
        title={zoneForm.id ? 'Edit area override' : 'New area override'}
        subtitle="Override the state default for a group of pincode prefixes in this state."
        width={640}
        closeOnBackdrop={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={() => setZoneModal(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="zone-form" loading={saving}>
              {zoneForm.id ? 'Save override' : 'Create override'}
            </Button>
          </>
        }
      >
        <form id="zone-form" onSubmit={submitZone} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {zoneError ? <Alert tone="error">{zoneError}</Alert> : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
            <Field label="Zone name" required hint="Shown to customers as the applied rule.">
              <Input
                value={zoneForm.name}
                onChange={(event) => setZoneForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Kanpur"
              />
            </Field>
            <Field label="Pincode prefixes" required hint="Three digits each. Separate multiple prefixes with commas.">
              <Input
                value={zoneForm.prefixesText}
                onChange={(event) => setZoneForm((current) => ({ ...current, prefixesText: event.target.value }))}
                placeholder="208, 209, 210"
              />
            </Field>
          </div>
          <Field label="Override status" hint="Paused zones fall back to the state default.">
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
                {zoneForm.isActive ? 'Active — applies to matching pincodes' : 'Paused — ignored at checkout'}
              </span>
              <Toggle
                checked={zoneForm.isActive}
                onChange={(isActive) => setZoneForm((current) => ({ ...current, isActive }))}
              />
            </div>
          </Field>
          <Divider />
          <div>
            <SectionTitle note="Pricing">Zone cart slabs</SectionTitle>
            <p style={{ margin: '6px 0 14px', fontSize: 11.5, color: colors.muted, lineHeight: 1.6 }}>
              These slabs replace the state slabs for matching pincodes. Cover every cart value from ₹0.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {zoneForm.slabs.map((slab, index) => (
                <div key={slab.slabId} style={{ border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: 14, background: colors.surface }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.muted, fontWeight: 600 }}>
                      Slab {index + 1}
                    </span>
                    <Button
                      size="sm"
                      variant="dangerGhost"
                      onClick={() => setZoneForm((current) => ({ ...current, slabs: current.slabs.filter((_, position) => position !== index) }))}
                    >
                      Remove
                    </Button>
                  </div>
                  <SlabEditor
                    compact
                    value={slab}
                    onChange={(value) => zoneSlabsEditor(index, value)}
                  />
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon="plus"
              style={{ marginTop: 12 }}
              onClick={() => setZoneForm((current) => ({ ...current, slabs: [...current.slabs, emptySlab()] }))}
            >
              Add slab
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteSlabTarget)}
        onClose={() => setDeleteSlabTarget(null)}
        onConfirm={removeSlab}
        title="Delete this slab?"
        message={
          deleteSlabTarget
            ? `The ${slabRange(deleteSlabTarget)} slab will be removed. Active slabs must still cover every cart value from ₹0.`
            : ''
        }
        confirmLabel="Delete slab"
        loading={deleting}
      />

      <ConfirmDialog
        open={Boolean(deleteZoneTarget)}
        onClose={() => setDeleteZoneTarget(null)}
        onConfirm={confirmDeleteZone}
        title="Delete this area override?"
        message={
          deleteZoneTarget
            ? `“${deleteZoneTarget.name}” will be removed. Matching pincodes will fall back to the state default rule.`
            : ''
        }
        confirmLabel="Delete override"
        loading={deleting}
      />
    </PageShell>
  );
}
