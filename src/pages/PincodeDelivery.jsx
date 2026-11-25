import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import { PageShell } from '../components/ui/Media.jsx';

const input = { padding: '9px 10px', border: '1px solid #ded1bf', borderRadius: 6, minWidth: 0, font: 'inherit' };
const rowStyle = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 };
const rupees = value => value == null ? '' : String(value / 100);
const paise = value => value === '' ? null : Math.round(Number(value) * 100);
const emptySlab = () => ({ slabId: crypto.randomUUID(), min: '', max: '', charge: '', isActive: true });
export default function PincodeDelivery() {
  const [slabs, setSlabs] = useState([]); const [pincodes, setPincodes] = useState([]); const [pincode, setPincode] = useState('');
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  async function loadRules() { const result = await api.request('/admin/delivery/rules'); setSlabs((result.data.rules?.slabs || []).map(s => ({ slabId: s.slabId, min: rupees(s.minCartValuePaise), max: rupees(s.maxCartValuePaise), charge: rupees(s.deliveryChargePaise), isActive: s.isActive }))); }
  async function loadPincodes() { const result = await api.request('/admin/delivery/pincodes', { params: { page, limit: 20, search } }); setPincodes(result.data.items); setPages(result.data.pagination.totalPages || 1); }
  useEffect(() => { loadRules().catch(e => setError(e.message)); }, []);
  useEffect(() => { loadPincodes().catch(e => setError(e.message)); }, [page, search]);
  async function addPincode(event) { event.preventDefault(); setBusy(true); setError(''); setNotice(''); try { await api.request('/admin/delivery/pincodes', { method: 'POST', body: { pincode } }); setPincode(''); await loadPincodes(); setNotice('Pincode added.'); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  async function toggle(item) { setBusy(true); setError(''); try { await api.request(`/admin/delivery/pincodes/${item.pincode}`, { method: 'PATCH', body: { isActive: !item.isActive } }); await loadPincodes(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  async function saveRules() { setBusy(true); setError(''); setNotice(''); try { if (slabs.some(s => s.min === '' || s.charge === '')) throw new Error('Enter a minimum and delivery charge for each slab.'); await api.request('/admin/delivery/rules', { method: 'PUT', body: { slabs: slabs.map(s => ({ slabId: s.slabId, minCartValuePaise: paise(s.min), maxCartValuePaise: paise(s.max), deliveryChargePaise: paise(s.charge), isActive: s.isActive })) } }); await loadRules(); setNotice('Delivery charges saved.'); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  const edit = (index, field, value) => setSlabs(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  return <PageShell><PageHeader eyebrow="Commerce" title="Delivery" subtitle="Manage serviceable pincodes and delivery charges for all orders." />
    {error && <Alert tone="error">{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}
    <div style={{ display: 'grid', gap: 20, marginTop: 18 }}><Panel title="Delivery charge slabs" subtitle="Charges use the cart subtotal before coupon discounts. Cover every value from ₹0 with no gaps; leave the last maximum blank.">
      {slabs.map((slab, index) => <div style={rowStyle} key={slab.slabId}><label>Minimum ₹ <input aria-label={`Slab ${index + 1} minimum`} style={{ ...input, width: 100 }} type="number" min="0" step="0.01" value={slab.min} onChange={e => edit(index, 'min', e.target.value)} /></label><label>Maximum ₹ <input aria-label={`Slab ${index + 1} maximum`} style={{ ...input, width: 100 }} type="number" min="0" step="0.01" placeholder="No limit" value={slab.max} onChange={e => edit(index, 'max', e.target.value)} /></label><label>Charge ₹ <input aria-label={`Slab ${index + 1} charge`} style={{ ...input, width: 100 }} type="number" min="0" step="0.01" value={slab.charge} onChange={e => edit(index, 'charge', e.target.value)} /></label><label><input type="checkbox" checked={slab.isActive} onChange={e => edit(index, 'isActive', e.target.checked)} /> Active</label><Button size="sm" variant="secondary" onClick={() => setSlabs(rows => rows.filter((_, i) => i !== index))}>Remove</Button></div>)}
      {!slabs.length && <p>No delivery charges configured yet.</p>}<div style={rowStyle}><Button variant="secondary" onClick={() => setSlabs(rows => [...rows, emptySlab()])}>Add slab</Button><Button onClick={saveRules} disabled={busy || !slabs.length}>Save charges</Button></div></Panel>
      <Panel title="Serviceable pincodes" subtitle="Only active six-digit pincodes can place an order."><form onSubmit={addPincode} style={rowStyle}><input style={input} aria-label="New pincode" value={pincode} onChange={e => setPincode(e.target.value)} pattern="[0-9]{6}" maxLength={6} required placeholder="Six-digit pincode" /><Button type="submit" disabled={busy}>Add pincode</Button></form><input style={{ ...input, marginBottom: 16 }} aria-label="Search pincodes" placeholder="Search pincodes" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      {!pincodes.length && <p>No pincodes found.</p>}{pincodes.map(item => <div key={item.pincode} style={{ ...rowStyle, justifyContent: 'space-between', borderTop: '1px solid #eee5da', paddingTop: 10 }}><strong>{item.pincode}</strong><span>{item.isActive ? 'Active' : 'Inactive'}</span><Button size="sm" variant="secondary" disabled={busy} onClick={() => toggle(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</Button></div>)}<div style={rowStyle}><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><span>Page {page} of {pages}</span><Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button></div></Panel></div></PageShell>;
}
