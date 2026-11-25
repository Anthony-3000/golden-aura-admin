import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import usePaginatedList from '../hooks/usePaginatedList.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Alert from '../components/ui/Alert.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Field, FormGrid, Input } from '../components/ui/Field.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import Badge from '../components/ui/Badge.jsx';
import { PageShell, StackedCell } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

const emptyForm = { name: '', displayOrder: 0, isActive: true };

export default function Collections() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const { items, pagination, loading, error, reload } = usePaginatedList(api.collections.list, {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Aura Collections · Golden Aura Admin';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, displayOrder: items.length + 1 });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (collection) => {
    setEditing(collection);
    setForm({
      name: collection.name || '',
      displayOrder: collection.displayOrder ?? 0,
      isActive: collection.isActive ?? true,
    });
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setFormError('A collection name is required.');
    const payload = {
      name: form.name.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await api.collections.update(editing.id || editing._id, payload);
        toast.success('Collection updated.');
      } else {
        await api.collections.create(payload);
        toast.success('Collection created.');
      }
      setFormOpen(false);
      reload();
    } catch (saveError) {
      setFormError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (collection) => {
    setBusy(true);
    try {
      await api.collections.setStatus(collection.id || collection._id, !collection.isActive);
      toast.success(`${collection.name} is now ${!collection.isActive ? 'active' : 'inactive'}.`);
      reload();
    } catch (statusError) {
      toast.error(statusError.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.collections.remove(deleteTarget.id || deleteTarget._id);
      toast.success('Collection deleted.');
      setDeleteTarget(null);
      reload();
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy(true);
    try {
      await api.collections.reorder(
        reordered.map((collection, itemIndex) => ({
          collectionId: collection.id || collection._id,
          displayOrder: itemIndex + 1,
        })),
      );
      toast.success('Collection order updated.');
      reload();
    } catch (orderError) {
      toast.error(orderError.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'collection',
      header: 'Collection tab',
      render: (collection) => (
        <StackedCell
          media={
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: colors.champagne,
                color: colors.goldDeep,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="layers" size={18} />
            </div>
          }
          title={collection.name}
          subtitle={`/ ${collection.slug || '—'}`}
        />
      ),
    },
    {
      key: 'products',
      header: 'Pieces',
      render: (collection) => (
        <Badge tone="neutral" dot={false}>
          {Array.isArray(collection.products) ? collection.products.length : collection.productCount ?? 0} in tab
        </Badge>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      align: 'center',
      width: 70,
      render: (collection) => (
        <span style={{ fontSize: 12, color: colors.muted }}>{collection.displayOrder ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (collection) => (
        <Toggle
          checked={Boolean(collection.isActive)}
          onChange={() => toggleStatus(collection)}
          disabled={busy}
          size="sm"
          label={collection.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 180,
      render: (collection, index) => (
        <TableActions>
          <IconButton icon="chevronUp" label="Move up" disabled={index === 0 || busy} onClick={() => move(index, -1)} />
          <IconButton
            icon="chevronDown"
            label="Move down"
            disabled={index === items.length - 1 || busy}
            onClick={() => move(index, 1)}
          />
          <IconButton icon="edit" label="Rename collection" onClick={() => openEdit(collection)} />
          <IconButton
            icon="view"
            label="Manage products"
            tone="gold"
            onClick={() => navigate(`/collections/${collection.id || collection._id}`)}
          />
          <IconButton icon="trash" label="Delete collection" tone="danger" onClick={() => setDeleteTarget(collection)} />
        </TableActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Merchandising"
        title="Aura Collections"
        subtitle="Dynamic tabs on the homepage. Assign products, order them and hide a tab without touching the catalogue."
        actions={<Button icon="plus" onClick={openCreate}>New collection</Button>}
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
          <SearchBar value={search} onChange={setSearch} placeholder="Search collections…" style={{ maxWidth: 320 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Badge tone="gold" dot={false}>{pagination.totalItems} tabs</Badge>
            <Button size="sm" variant="ghost" icon="refresh" onClick={reload} loading={loading} />
          </div>
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Collections could not be loaded"
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
          minWidth={860}
          rowKey={(collection) => collection.id || collection._id}
          empty={
            !loading ? (
              <EmptyState
                icon="layers"
                title={search ? 'No collections match your search' : 'Open the first collection tab'}
                description={
                  search
                    ? 'Try a different tab name.'
                    : 'Aura Collections are dynamic tabs such as Best Sellers, New Arrivals or the Bridal Edit.'
                }
                action={
                  <Button size="sm" icon="plus" onClick={search ? () => setSearch('') : openCreate}>
                    {search ? 'Clear search' : 'Create a collection'}
                  </Button>
                }
              />
            ) : null
          }
          footer={<div style={{ padding: '0 16px' }}><Pagination {...pagination} onChange={setPage} /></div>}
        />
      </Panel>

      <Modal
        open={formOpen}
        onClose={saving ? undefined : () => setFormOpen(false)}
        title={editing ? 'Edit collection' : 'New collection'}
        subtitle="Collection tab names are data-managed and never hard-coded in the storefront."
        width={520}
        closeOnBackdrop={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="collection-form" loading={saving}>
              {editing ? 'Save changes' : 'Create collection'}
            </Button>
          </>
        }
      >
        <form id="collection-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formError ? <Alert tone="error">{formError}</Alert> : null}
          <Field label="Collection name" required>
            <Input
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              placeholder="Best Sellers"
              maxLength={120}
              autoFocus
            />
          </Field>
          <FormGrid>
            <Field label="Display order" hint="Lower numbers appear first.">
              <Input
                type="number"
                min="0"
                value={form.displayOrder}
                onChange={(event) => setForm((state) => ({ ...state, displayOrder: event.target.value }))}
              />
            </Field>
            <Field label="Visibility" hint="Only active tabs are shown publicly.">
              <div style={{ paddingTop: 9 }}>
                <Toggle
                  checked={form.isActive}
                  onChange={(isActive) => setForm((state) => ({ ...state, isActive }))}
                  label={form.isActive ? 'Active' : 'Inactive'}
                />
              </div>
            </Field>
          </FormGrid>
          {editing?.slug ? (
            <div style={{ fontSize: 11, color: colors.faint }}>
              Public slug: <span style={{ fontFamily: 'ui-monospace, monospace', color: colors.inkSoft }}>/{editing.slug}</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: colors.faint, lineHeight: 1.5 }}>
              The backend generates the public slug from the tab name.
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this collection tab?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed from the homepage. Products themselves are not deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete collection"
        loading={deleting}
      />
    </PageShell>
  );
}
