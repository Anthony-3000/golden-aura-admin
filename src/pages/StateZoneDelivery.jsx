import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { INDIAN_STATES } from '../lib/constants.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import { PageShell } from '../components/ui/Media.jsx';
const input = { padding: '9px', border: '1px solid #ded1bf', borderRadius: 6, font: 'inherit', maxWidth: '100%' };
const row = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 };
const fresh = () => ({ slabId: crypto.randomUUID(), min: '0', max: '', charge: '', isActive: true });
const defaultSlabs = () => [{ slabId: 'standard', min: '0', max: '598.99', charge: '50', isActive: true }, { slabId: 'free', min: '599', max: '', charge: '0', isActive: true }];
const toForm = slabs => slabs.map(s => ({ slabId: s.slabId, min: String(s.minCartValuePaise / 100), max: s.maxCartValuePaise == null ? '' : String(s.maxCartValuePaise / 100), charge: String(s.deliveryChargePaise / 100), isActive: s.isActive !== false }));
const toPayload = slabs => slabs.map(s => ({ slabId: s.slabId, minCartValuePaise: Math.round(Number(s.min) * 100), maxCartValuePaise: s.max === '' ? null : Math.round(Number(s.max) * 100), deliveryChargePaise: Math.round(Number(s.charge) * 100), isActive: s.isActive }));
function Slabs({ value, onChange }) {
  const edit = (i, key, v) => onChange(value.map((s, n) => n === i ? { ...s, [key]: v } : s));
  return <><p>Cover every cart value from ₹0. Leave the last maximum blank. Amounts are inclusive.</p>{value.map((s, i) => <div style={row} key={s.slabId}>{[['min', 'Minimum ₹'], ['max', 'Maximum ₹'], ['charge', 'Charge ₹']].map(([field, label]) => <label key={field}>{label} <input aria-label={`Slab ${i + 1} ${label}`} style={{ ...input, width: 105 }} type="number" min="0" step="0.01" value={s[field]} onChange={e => edit(i, field, e.target.value)} /></label>)}<label><input type="checkbox" checked={s.isActive} onChange={e => edit(i, 'isActive', e.target.checked)} /> Active</label><Button size="sm" variant="secondary" onClick={() => onChange(value.filter((_, n) => n !== i))}>Remove</Button></div>)}<Button variant="secondary" size="sm" onClick={() => onChange([...value, fresh()])}>Add slab</Button></>;
}
export default function StateZoneDelivery() {
  const [code, setCode] = useState(''); const [config, setConfig] = useState(null); const [slabs, setSlabs] = useState([]); const [enabled, setEnabled] = useState(false);
  const [zones, setZones] = useState([]); const [zone, setZone] = useState(null); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  async function load(selected) {
    const [state, list] = await Promise.all([api.request(`/admin/delivery/states/${selected}`).catch(e => { if (e.status === 404) return { data: { state: null } }; throw e; }), api.request('/admin/delivery/zones', { params: { stateCode: selected, limit: 100 } })]);
    const current = state.data.state; setConfig(current); setSlabs(current?.slabs?.length ? toForm(current.slabs) : defaultSlabs()); setEnabled(Boolean(current?.isDeliveryEnabled)); setZones(list.data.items); setZone(null);
  }
  useEffect(() => { if (!code) return; setError(''); load(code).catch(e => setError(e.message)); }, [code]);
  const check = rows => { if (!rows.length || rows.some(s => s.min === '' || s.charge === '')) throw new Error('Each slab needs a minimum and charge.'); return toPayload(rows); };
  async function saveState() { setBusy(true); setError(''); setNotice(''); try { await api.request(`/admin/delivery/states/${code}`, { method: 'PUT', body: { isDeliveryEnabled: enabled, slabs: check(slabs) } }); await load(code); setNotice('State delivery rule saved.'); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  async function saveZone() { setBusy(true); setError(''); setNotice(''); try { const body = { stateCode: code, name: zone.name.trim(), pincodePrefixes: zone.prefixes.split(/[\s,]+/).filter(Boolean), isActive: zone.isActive, slabs: check(zone.slabs) }; await api.request(zone.id ? `/admin/delivery/zones/${zone.id}` : '/admin/delivery/zones', { method: zone.id ? 'PUT' : 'POST', body }); await load(code); setNotice('Zone saved.'); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  async function toggleZone(item) { setBusy(true); setError(''); try { await api.request(`/admin/delivery/zones/${item._id}/status`, { method: 'PATCH', body: { isActive: !item.isActive } }); await load(code); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  const newZone = () => setZone({ name: '', prefixes: '', isActive: true, slabs: defaultSlabs() });
  return <PageShell><PageHeader eyebrow="Commerce" title="Delivery rules" subtitle="State defaults and optional pincode-prefix zone overrides." />{error && <Alert tone="error">{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}<div style={{ display: 'grid', gap: 18, marginTop: 18 }}><Panel title="Choose a state"><label>State or territory <select style={input} value={code} onChange={e => setCode(e.target.value)}><option value="">Select a state</option>{INDIAN_STATES.map(s => <option value={s.code} key={s.code}>{s.name}</option>)}</select></label></Panel>
  {code && <><Panel title="State default" subtitle="Applies to known pincodes with no matching active zone."><label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Enable delivery in this state</label><Slabs value={slabs} onChange={setSlabs} /><div style={{ marginTop: 16 }}><Button onClick={saveState} disabled={busy}>Save state rule</Button></div></Panel>
  <Panel title="Special zones" subtitle="Active zones override the state rule for matching three-digit prefixes.">{!config && <p>Save the state rule before adding zones.</p>}{zones.map(z => <div style={{ ...row, borderBottom: '1px solid #eee5da', paddingBottom: 12 }} key={z._id}><strong>{z.name}</strong><span>{z.pincodePrefixes.join(', ')} · {z.isActive ? 'Active' : 'Inactive'}</span><Button size="sm" variant="secondary" onClick={() => setZone({ id: z._id, name: z.name, prefixes: z.pincodePrefixes.join(', '), isActive: z.isActive, slabs: toForm(z.slabs) })}>Edit</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => toggleZone(z)}>{z.isActive ? 'Deactivate' : 'Activate'}</Button></div>)}<Button variant="secondary" disabled={!config} onClick={newZone}>Add zone</Button></Panel>
  {zone && <Panel title={zone.id ? 'Edit zone' : 'New zone'}><div style={row}><label>Zone name <input style={input} value={zone.name} onChange={e => setZone({ ...zone, name: e.target.value })} /></label><label>Prefixes <input style={input} placeholder="208, 209" value={zone.prefixes} onChange={e => setZone({ ...zone, prefixes: e.target.value })} /></label><label><input type="checkbox" checked={zone.isActive} onChange={e => setZone({ ...zone, isActive: e.target.checked })} /> Active</label></div><Slabs value={zone.slabs} onChange={v => setZone({ ...zone, slabs: v })} /><div style={{ ...row, marginTop: 16 }}><Button onClick={saveZone} disabled={busy}>Save zone</Button><Button variant="secondary" onClick={() => setZone(null)}>Cancel</Button></div></Panel>}</>}
  </div></PageShell>;
}
