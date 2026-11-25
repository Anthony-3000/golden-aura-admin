import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, radii, shadows } from '../lib/theme.js';
import { api, extractList } from '../lib/api.js';
import { formatINR } from '../lib/format.js';
import { INDIAN_STATES } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import Modal from '../components/ui/Modal.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Field, Select } from '../components/ui/Field.jsx';
import Icon from '../components/Icon.jsx';
import { PageShell } from '../components/ui/Media.jsx';

const DEFAULT_SLABS = [
  { slabId: 'standard', minCartValuePaise: 0, maxCartValuePaise: 59899, deliveryChargePaise: 5000, isActive: true },
  { slabId: 'free', minCartValuePaise: 59900, maxCartValuePaise: null, deliveryChargePaise: 0, isActive: true },
];

const FLOW_STEPS = [
  { icon: 'pin', title: 'Pincode', detail: 'Customer enters six digits at checkout.' },
  { icon: 'layers', title: 'State', detail: 'The pincode master identifies the state.' },
  { icon: 'sparkle', title: 'Area override', detail: 'A matching zone replaces the state price.' },
  { icon: 'receipt', title: 'Cart slab', detail: 'The subtotal picks the final charge.' },
];

function stateCodeOf(config) {
  return config?.stateCode || config?.code || config?.state?.code || '';
}

function activeSlabs(config) {
  return (Array.isArray(config?.slabs) ? config.slabs : []).filter((slab) => slab.isActive !== false);
}

function cheapestCharge(config) {
  const charges = activeSlabs(config)
    .map((slab) => Number(slab.deliveryChargePaise))
    .filter((value) => Number.isFinite(value));
  return charges.length ? Math.min(...charges) : null;
}

function hasFreeDelivery(config) {
  return activeSlabs(config).some((slab) => Number(slab.deliveryChargePaise) === 0);
}

function Stat({ icon, label, value, suffix, hint, tone = colors.gold }) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '16px 18px',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 3,
          background: tone,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.muted, fontWeight: 600 }}>
          {label}
        </span>
        <Icon name={icon} size={16} style={{ color: tone, opacity: 0.8 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
        <span style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: colors.ink, lineHeight: 1 }}>
          {value}
        </span>
        {suffix ? <span style={{ fontSize: 12, color: colors.faint }}>{suffix}</span> : null}
      </div>
      <div style={{ fontSize: 11, color: colors.faint, marginTop: 7, lineHeight: 1.45 }}>{hint}</div>
    </div>
  );
}

function RuleFlow() {
  return (
    <Panel
      bare
      style={{ marginBottom: 18, background: `linear-gradient(115deg, ${colors.ink} 0%, #33261B 58%, #4A3521 100%)`, borderColor: colors.ink }}
    >
      <div style={{ padding: '20px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: '#C9A96B', fontWeight: 600 }}>
              The decision path
            </div>
            <h2 style={{ margin: '6px 0 0', fontFamily: fonts.display, fontSize: 24, fontWeight: 600, color: '#FBF4E8' }}>
              How every delivery charge is chosen
            </h2>
          </div>
          <span style={{ fontSize: 11, color: '#C6B7A1' }}>
            Customers never pick a state or zone — the backend does it for them.
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {FLOW_STEPS.map((step, index) => (
            <div
              key={step.title}
              style={{
                position: 'relative',
                padding: '13px 14px',
                borderRadius: radii.md,
                border: '1px solid rgba(236, 216, 180, 0.16)',
                background: 'rgba(255, 251, 243, 0.055)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#D4A84B' }}>
                  <Icon name={step.icon} size={15} />
                </span>
                <span style={{ fontSize: 9.5, letterSpacing: 1.4, color: '#B9A68D', fontFamily: 'ui-monospace, monospace' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#F7EEDF', marginTop: 9 }}>{step.title}</div>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: '#BCAE9A', marginTop: 4 }}>{step.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: '#BCAE9A', lineHeight: 1.6 }}>
          A disabled state blocks checkout everywhere inside it — even where an area override exists.
        </div>
      </div>
    </Panel>
  );
}

export default function Delivery() {
  const navigate = useNavigate();
  const toast = useToast();

  const [configs, setConfigs] = useState([]);
  const [zoneCounts, setZoneCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [statusBusy, setStatusBusy] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newStateCode, setNewStateCode] = useState('');

  useEffect(() => {
    document.title = 'Delivery Rules · Golden Aura Admin';
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.delivery.list({ page: 1, limit: 100 }),
      api.delivery.zones.list({ page: 1, limit: 100 }),
    ])
      .then(([stateResponse, zoneResponse]) => {
        if (!active) return;
        setConfigs(extractList(stateResponse.data).items);
        const counts = {};
        extractList(zoneResponse.data).items.forEach((zone) => {
          const code = String(zone.stateCode || '').toUpperCase();
          counts[code] = (counts[code] || 0) + 1;
        });
        setZoneCounts(counts);
        setError(null);
      })
      .catch((loadError) => {
        if (!active) return;
        setConfigs([]);
        setError(loadError);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [version]);

  const reload = () => setVersion((value) => value + 1);

  const configuredCodes = useMemo(
    () => new Set(configs.map((config) => stateCodeOf(config).toUpperCase()).filter(Boolean)),
    [configs],
  );
  const availableStates = INDIAN_STATES.filter((state) => !configuredCodes.has(state.code));
  const enabledCount = configs.filter((config) => config.isDeliveryEnabled).length;
  const freeCount = configs.filter((config) => config.isDeliveryEnabled && hasFreeDelivery(config)).length;
  const needsSetupCount = configs.filter((config) => activeSlabs(config).length === 0).length;
  const zoneTotal = Object.values(zoneCounts).reduce((sum, count) => sum + count, 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return configs.filter((config) => {
      if (tab === 'enabled' && !config.isDeliveryEnabled) return false;
      if (tab === 'disabled' && config.isDeliveryEnabled) return false;
      if (tab === 'setup' && activeSlabs(config).length > 0) return false;
      if (!term) return true;
      return (
        String(config.stateName || '').toLowerCase().includes(term) ||
        stateCodeOf(config).toLowerCase().includes(term)
      );
    });
  }, [configs, search, tab]);

  const toggleStatus = async (config) => {
    const code = stateCodeOf(config);
    if (!code) return;
    setStatusBusy(code);
    try {
      await api.delivery.setStatus(code, !config.isDeliveryEnabled);
      toast.success(`Delivery in ${config.stateName || code} is now ${!config.isDeliveryEnabled ? 'enabled' : 'disabled'}.`);
      reload();
    } catch (statusError) {
      toast.error(statusError.message);
    } finally {
      setStatusBusy(null);
    }
  };

  const goToState = (code) => {
    if (!code) return;
    setAddOpen(false);
    setNewStateCode('');
    navigate(`/delivery/${code}`);
  };

  const columns = [
    {
      key: 'state',
      header: 'State / territory',
      render: (config) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span
            style={{
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              borderRadius: radii.sm,
              background: colors.champagne,
              border: `1px solid ${colors.border}`,
              color: colors.goldDeep,
              flexShrink: 0,
            }}
          >
            <Icon name="pin" size={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>{config.stateName || 'State'}</div>
            <div style={{ fontSize: 10, color: colors.faint, marginTop: 2, letterSpacing: 1, fontFamily: 'ui-monospace, monospace' }}>
              {stateCodeOf(config)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Lowest default charge',
      render: (config) => {
        const charge = cheapestCharge(config);
        if (charge === null) {
          return <span style={{ fontSize: 11.5, color: colors.warning }}>Pricing needed</span>;
        }
        return (
          <span style={{ fontSize: 13, color: charge === 0 ? colors.success : colors.ink, fontWeight: 600 }}>
            {charge === 0 ? 'Free' : formatINR(charge)}
          </span>
        );
      },
    },
    {
      key: 'slabs',
      header: 'Cart slabs',
      align: 'center',
      width: 96,
      render: (config) => {
        const total = Array.isArray(config.slabs) ? config.slabs.length : 0;
        const count = activeSlabs(config).length;
        return (
          <span style={{ fontSize: 12, color: count ? colors.inkSoft : colors.faint }}>
            {count}<span style={{ color: colors.faint }}> / {total}</span>
          </span>
        );
      },
    },
    {
      key: 'zones',
      header: 'Area overrides',
      render: (config) => {
        const count = zoneCounts[stateCodeOf(config)] || 0;
        return count ? (
          <Badge tone="gold">{count} {count === 1 ? 'zone' : 'zones'}</Badge>
        ) : (
          <span style={{ fontSize: 11.5, color: colors.faint }}>State rule only</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Checkout',
      render: (config) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Toggle
            checked={Boolean(config.isDeliveryEnabled)}
            onChange={() => toggleStatus(config)}
            disabled={statusBusy === stateCodeOf(config)}
            size="sm"
            label={config.isDeliveryEnabled ? 'Enabled' : 'Disabled'}
          />
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 64,
      render: (config) => (
        <TableActions>
          <IconButton icon="chevronRight" label={`Configure ${config.stateName || stateCodeOf(config)}`} onClick={() => goToState(stateCodeOf(config))} />
        </TableActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Commerce · Delivery"
        title="Delivery rules"
        subtitle="Customers enter only a pincode. We identify its state, apply an area override when one matches, then use the cart subtotal to set the charge."
        actions={
          <>
            <Badge tone="success">{enabledCount} enabled</Badge>
            <Button icon="plus" onClick={() => setAddOpen(true)} disabled={!availableStates.length}>
              Configure state
            </Button>
          </>
        }
      />

      <RuleFlow />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Stat
          icon="truck"
          label="Serviceable states"
          value={enabledCount}
          suffix={`/ ${configs.length}`}
          hint="Ready to accept checkout orders"
          tone={colors.success}
        />
        <Stat
          icon="sparkle"
          label="Free delivery"
          value={freeCount}
          hint="States with a zero-charge slab"
          tone={colors.info}
        />
        <Stat
          icon="layers"
          label="Area overrides"
          value={zoneTotal}
          hint="Zones with their own pricing"
          tone={colors.gold}
        />
        <Stat
          icon="alert"
          label="Needs attention"
          value={needsSetupCount}
          hint="States without an active slab"
          tone={needsSetupCount ? colors.warning : colors.faint}
        />
      </div>

      <Panel bare>
        <div style={{ padding: '14px 18px 0' }}>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'all', label: 'All states', count: configs.length },
              { value: 'enabled', label: 'Enabled', count: enabledCount },
              { value: 'disabled', label: 'Disabled', count: configs.length - enabledCount },
              { value: 'setup', label: 'Needs pricing', count: needsSetupCount },
            ]}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            padding: '14px 18px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search state or code…"
            style={{ maxWidth: 320 }}
          />
          <Button size="sm" variant="ghost" icon="refresh" onClick={reload} loading={loading}>
            Refresh
          </Button>
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Delivery rules could not be loaded"
              action={<Button size="sm" variant="secondary" icon="refresh" onClick={reload}>Retry</Button>}
            >
              {error.message}
            </Alert>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          minWidth={900}
          rowKey={(config) => stateCodeOf(config)}
          onRowClick={(config) => goToState(stateCodeOf(config))}
          empty={
            !loading ? (
              <EmptyState
                icon="truck"
                title={search || tab !== 'all' ? 'No states match this view' : 'No state delivery configured'}
                description={
                  search || tab !== 'all'
                    ? 'Try clearing the search or switching tabs.'
                    : 'Add a state to define serviceability and cart-value delivery slabs.'
                }
                action={
                  search || tab !== 'all' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSearch('');
                        setTab('all');
                      }}
                    >
                      Reset view
                    </Button>
                  ) : (
                    <Button size="sm" icon="plus" onClick={() => setAddOpen(true)}>
                      Configure the first state
                    </Button>
                  )
                }
              />
            ) : null
          }
        />
      </Panel>

      <div style={{ marginTop: 14, fontSize: 11, color: colors.faint, lineHeight: 1.7 }}>
        Delivery charges use the merchandise subtotal before coupon discount. The backend rechecks the rule at checkout,
        so saved prices here are always authoritative.
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Configure a state"
        subtitle="Choose a state or union territory that does not have delivery rules yet."
        width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button icon="arrowRight" onClick={() => goToState(newStateCode)} disabled={!newStateCode}>
              Open configuration
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {availableStates.length ? (
            <>
              <Field label="State or union territory" required>
                <Select value={newStateCode} onChange={(event) => setNewStateCode(event.target.value)}>
                  <option value="">Select a state</option>
                  {availableStates.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </Select>
              </Field>
              <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.6 }}>
                You will get a ready-to-edit starting rule: {formatINR(DEFAULT_SLABS[0].deliveryChargePaise)} up to{' '}
                {formatINR(DEFAULT_SLABS[0].maxCartValuePaise)}, then free. Delivery stays off until you enable it.
              </div>
            </>
          ) : (
            <EmptyState
              compact
              icon="check"
              title="Every state is configured"
              description="All 36 states and territories already have a delivery configuration record."
            />
          )}
        </div>
      </Modal>
    </PageShell>
  );
}
