import { useEffect, useState } from 'react';
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
import { Field, FormGrid, Input, Textarea } from '../components/ui/Field.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import ImageUploader from '../components/ui/ImageUploader.jsx';
import Badge from '../components/ui/Badge.jsx';
import { PageShell, StackedCell, Thumb } from '../components/ui/Media.jsx';

const emptyForm = {
  name: '',
  description: '',
  image: [],
  displayOrder: 0,
  isActive: true,
};

export default function Categories() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const params = { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) };
  const { items, pagination, loading, error, reload } = usePaginatedList(api.categories.list, params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    document.title = 'Categories · Golden Aura Admin';
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

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || '',
      description: category.description || '',
      image: category.image?.publicUrl ? [{ ...category.image, displayOrder: 1 }] : [],
      displayOrder: category.displayOrder ?? 0,
      isActive: category.isActive ?? true,
    });
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('A category name is required.');
      return;
    }
    if (!form.image.length) {
      setFormError('A category image is required. Upload one or add an image URL.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: {
        objectKey: form.image[0].objectKey,
        publicUrl: form.image[0].publicUrl,
        altText: form.image[0].altText || form.name.trim(),
        ...(form.image[0].contentType ? { contentType: form.image[0].contentType } : {}),
        ...(form.image[0].sizeBytes ? { sizeBytes: form.image[0].sizeBytes } : {}),
      },
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.categories.update(editing.id || editing._id, payload);
        toast.success('Category updated.');
      } else {
        await api.categories.create(payload);
        toast.success('Category created.');
      }
      setFormOpen(false);
      reload();
    } catch (saveError) {
      setFormError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category) => {
    const id = category.id || category._id;
    setStatusBusy(id);
    try {
      await api.categories.setStatus(id, !category.isActive);
      toast.success(`${category.name} is now ${!category.isActive ? 'active' : 'inactive'}.`);
      reload();
    } catch (statusError) {
      toast.error(statusError.message);
    } finally {
      setStatusBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.categories.remove(deleteTarget.id || deleteTarget._id);
      toast.success('Category deleted.');
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
    setReordering(true);
    try {
      await api.categories.reorder(
        reordered.map((category, itemIndex) => ({
          categoryId: category.id || category._id,
          displayOrder: itemIndex + 1,
        })),
      );
      toast.success('Category order updated.');
      reload();
    } catch (orderError) {
      toast.error(orderError.message);
    } finally {
      setReordering(false);
    }
  };

  const columns = [
    {
      key: 'category',
      header: 'Category',
      render: (category) => (
        <StackedCell
          media={<Thumb src={category.image?.publicUrl} alt={category.image?.altText || category.name} icon="category" />}
          title={category.name}
          subtitle={`/ ${category.slug || '—'}`}
        />
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (category) => (
        <span
          style={{
            display: 'block',
            maxWidth: 300,
            fontSize: 12,
            color: colors.muted,
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {category.description || '—'}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      align: 'center',
      width: 70,
      render: (category) => <span style={{ fontSize: 12, color: colors.muted }}>{category.displayOrder ?? 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (category) => (
        <Toggle
          checked={Boolean(category.isActive)}
          onChange={() => toggleStatus(category)}
          disabled={statusBusy === (category.id || category._id)}
          size="sm"
          label={category.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 148,
      render: (category, index) => (
        <TableActions>
          <IconButton icon="chevronUp" label="Move up" disabled={index === 0 || reordering} onClick={() => move(index, -1)} />
          <IconButton
            icon="chevronDown"
            label="Move down"
            disabled={index === items.length - 1 || reordering}
            onClick={() => move(index, 1)}
          />
          <IconButton icon="edit" label="Edit category" onClick={() => openEdit(category)} />
          <IconButton icon="trash" label="Delete category" tone="danger" onClick={() => setDeleteTarget(category)} />
        </TableActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        subtitle="The house's product categories, shown in Find Your Perfect Match and across the storefront. Each category carries one image."
        actions={<Button icon="plus" onClick={openCreate} disabled={Boolean(error)}>New category</Button>}
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
            placeholder="Search categories…"
            style={{ maxWidth: 320 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge tone="gold" dot={false}>{pagination.totalItems} total</Badge>
            <Button size="sm" variant="ghost" icon="refresh" onClick={reload} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Categories could not be loaded"
              action={
                <Button size="sm" variant="secondary" onClick={reload} icon="refresh">
                  Retry
                </Button>
              }
            >
              {error.message}
            </Alert>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          minWidth={820}
          rowKey={(category) => category.id || category._id}
          empty={
            !loading ? (
              <EmptyState
                icon="category"
                title={search ? 'No categories match your search' : 'Begin with a category'}
                description={
                  search
                    ? 'Try a different name or clear the search.'
                    : 'Categories organise the catalogue and power the Find Your Perfect Match section.'
                }
                action={
                  search ? (
                    <Button size="sm" variant="secondary" onClick={() => setSearch('')}>
                      Clear search
                    </Button>
                  ) : (
                    <Button size="sm" icon="plus" onClick={openCreate}>
                      Create the first category
                    </Button>
                  )
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
        title={editing ? 'Edit category' : 'New category'}
        subtitle={
          editing
            ? 'Refine the name, image and place in the house.'
            : 'Categories appear publicly in display order when active.'
        }
        width={640}
        closeOnBackdrop={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" loading={saving}>
              {editing ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {formError ? <Alert tone="error">{formError}</Alert> : null}

          <Field label="Category name" required htmlFor="category-name">
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              placeholder="Necklaces"
              maxLength={120}
            />
          </Field>

          <Field label="Description" hint="Optional. Used by catalogue surfaces that support a short description.">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
              placeholder="Elegant necklaces for everyday and occasion wear."
              maxLength={500}
            />
          </Field>

          <Field label="Category image" required hint="One image per category. The first image is used.">
            <ImageUploader
              images={form.image}
              onChange={(image) => setForm((state) => ({ ...state, image }))}
              purpose="category"
              single
              helper="Shown on the homepage category card."
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
            <Field label="Visibility" hint="Only active categories appear publicly.">
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
          ) : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this category?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” can only be deleted when no products reference it. If products remain, deactivate the category instead. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete category"
        loading={deleting}
      />
    </PageShell>
  );
}
