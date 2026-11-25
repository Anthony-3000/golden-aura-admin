import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, radii } from '../lib/theme.js';
import { api, extractList } from '../lib/api.js';
import { formatINR } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import Badge from '../components/ui/Badge.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { KeyValue, PageShell, StackedCell, Thumb } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

function memberProduct(membership) {
  if (!membership) return null;
  if (membership.product && typeof membership.product === 'object') return membership.product;
  if (membership.name && membership.pricePaise !== undefined) return membership;
  return null;
}

function memberProductId(membership) {
  const product = memberProduct(membership);
  if (product) return product.id || product._id;
  if (typeof membership?.product === 'string') return membership.product;
  return membership?.productId;
}

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const debouncedProductSearch = useDebouncedValue(productSearch, 350);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = () => {
    setLoading(true);
    api.collections
      .get(id)
      .then((response) => {
        const data = response.data?.collection || response.data;
        setCollection(data);
        setRenameValue(data?.name || '');
        setError(null);
      })
      .catch((loadError) => setError(loadError))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    document.title = collection?.name ? `${collection.name} · Aura Collections` : 'Aura Collection · Golden Aura Admin';
  }, [collection]);

  useEffect(() => {
    if (!addOpen) return;
    let active = true;
    setProductsLoading(true);
    api.products
      .list({ page: 1, limit: 20, ...(debouncedProductSearch ? { search: debouncedProductSearch } : {}) })
      .then((response) => active && setProducts(extractList(response.data).items))
      .catch((productError) => {
        if (active) {
          setProducts([]);
          toast.error(productError.message);
        }
      })
      .finally(() => active && setProductsLoading(false));
    return () => {
      active = false;
    };
  }, [addOpen, debouncedProductSearch]);

  const members = Array.isArray(collection?.products) ? collection.products : [];
  const memberIds = new Set(members.map(memberProductId).filter(Boolean));
  const collectionId = collection?.id || collection?._id || id;

  const rename = async (event) => {
    event.preventDefault();
    if (!renameValue.trim()) return setRenameError('Enter a collection name.');
    setRenaming(true);
    setRenameError('');
    try {
      await api.collections.update(collectionId, { name: renameValue.trim() });
      toast.success('Collection renamed.');
      setRenameOpen(false);
      load();
    } catch (renameFailure) {
      setRenameError(renameFailure.message);
    } finally {
      setRenaming(false);
    }
  };

  const toggleActive = async () => {
    setBusy('status');
    try {
      await api.collections.setStatus(collectionId, !collection.isActive);
      toast.success(`Tab is now ${!collection.isActive ? 'active' : 'inactive'}.`);
      load();
    } catch (statusError) {
      toast.error(statusError.message);
    } finally {
      setBusy(null);
    }
  };

  const toggleVisibility = async (membership) => {
    const productId = memberProductId(membership);
    setBusy(productId);
    try {
      await api.collections.updateProduct(collectionId, productId, { isVisible: !membership.isVisible });
      toast.success(`Membership ${!membership.isVisible ? 'shown' : 'hidden'} in this tab.`);
      load();
    } catch (visibilityError) {
      toast.error(visibilityError.message);
    } finally {
      setBusy(null);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= members.length) return;
    const reordered = [...members];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy('reorder');
    try {
      await api.collections.reorderProducts(
        collectionId,
        reordered.map((membership, itemIndex) => ({
          productId: memberProductId(membership),
          displayOrder: itemIndex + 1,
        })),
      );
      toast.success('Product order updated.');
      load();
    } catch (orderError) {
      toast.error(orderError.message);
    } finally {
      setBusy(null);
    }
  };

  const addProduct = async (product) => {
    const productId = product.id || product._id;
    setAddingId(productId);
    try {
      await api.collections.addProduct(collectionId, {
        productId,
        displayOrder: members.length + 1,
        isVisible: true,
      });
      toast.success(`${product.name} added to the collection.`);
      load();
    } catch (addError) {
      toast.error(addError.message);
    } finally {
      setAddingId(null);
    }
  };

  const removeProduct = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.collections.removeProduct(collectionId, memberProductId(removeTarget));
      toast.success('Product removed from the collection. The product itself is untouched.');
      setRemoveTarget(null);
      load();
    } catch (removeError) {
      toast.error(removeError.message);
    } finally {
      setRemoving(false);
    }
  };

  if (loading && !collection) return <PageLoader label="Opening the collection…" />;

  if (error && !collection) {
    return (
      <PageShell>
        <PageHeader eyebrow="Merchandising" title="Aura Collection" />
        <Alert
          tone="error"
          title="This collection could not be loaded"
          action={
            <Button size="sm" variant="secondary" icon="arrowLeft" onClick={() => navigate('/collections')}>
              Back to collections
            </Button>
          }
        >
          {error.message}
        </Alert>
      </PageShell>
    );
  }

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (membership) => {
        const product = memberProduct(membership);
        const image = product?.images?.[0]?.publicUrl;
        const productId = memberProductId(membership);
        return (
          <StackedCell
            media={<Thumb src={image} alt={product?.name || 'Product'} icon="gem" size={44} />}
            title={product?.name || `Product ${String(productId).slice(-6)}`}
            subtitle={product?.category?.name || product?.categoryName || product?.material || 'Catalogue piece'}
          />
        );
      },
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (membership) => {
        const product = memberProduct(membership);
        return (
          <span style={{ fontSize: 12.5, color: colors.ink }}>{formatINR(product?.pricePaise)}</span>
        );
      },
    },
    {
      key: 'order',
      header: 'Order',
      align: 'center',
      width: 70,
      render: (membership) => (
        <span style={{ fontSize: 12, color: colors.muted }}>{membership.displayOrder ?? 0}</span>
      ),
    },
    {
      key: 'visible',
      header: 'Visible',
      render: (membership) => (
        <Toggle
          checked={membership.isVisible !== false}
          onChange={() => toggleVisibility(membership)}
          disabled={busy === memberProductId(membership)}
          size="sm"
          label={membership.isVisible !== false ? 'Shown' : 'Hidden'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 150,
      render: (membership, index) => (
        <TableActions>
          <IconButton icon="chevronUp" label="Move up" disabled={index === 0 || busy} onClick={() => move(index, -1)} />
          <IconButton
            icon="chevronDown"
            label="Move down"
            disabled={index === members.length - 1 || busy}
            onClick={() => move(index, 1)}
          />
          <IconButton icon="close" label="Remove from collection" tone="danger" onClick={() => setRemoveTarget(membership)} />
        </TableActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Aura Collection"
        title={collection?.name || 'Collection'}
        subtitle={`${members.length} ${members.length === 1 ? 'piece' : 'pieces'} in this homepage tab. A product can live in several collections, but only once per tab.`}
        actions={
          <>
            <Button variant="secondary" icon="arrowLeft" onClick={() => navigate('/collections')}>
              Back
            </Button>
            <Button icon="plus" onClick={() => setAddOpen(true)}>
              Add product
            </Button>
          </>
        }
      />

      {error ? <Alert tone="error" style={{ marginBottom: 16 }}>{error.message}</Alert> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.65fr) minmax(260px, 0.65fr)',
          gap: 18,
          alignItems: 'start',
        }}
        className="ga-collection-grid"
      >
        <style>{'@media (max-width: 980px){ .ga-collection-grid { grid-template-columns: 1fr !important; } }'}</style>

        <Panel
          title="Membership order"
          subtitle="Products appear publicly in this order when visible and active."
          padding={0}
          action={
            <Button size="sm" variant="ghost" icon="refresh" onClick={load} loading={loading}>
              Refresh
            </Button>
          }
        >
          <DataTable
            columns={columns}
            rows={members}
            loading={loading}
            minWidth={700}
            rowKey={(membership, index) => memberProductId(membership) || index}
            empty={
              <EmptyState
                icon="layers"
                title="This tab is still empty"
                description="Add products from the catalogue to bring this Aura Collection to life."
                action={<Button size="sm" icon="plus" onClick={() => setAddOpen(true)}>Add a product</Button>}
              />
            }
          />
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Tab settings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>Publicly visible</div>
                  <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
                    {collection?.isActive ? 'Active on the homepage' : 'Hidden from the homepage'}
                  </div>
                </div>
                <Toggle
                  checked={Boolean(collection?.isActive)}
                  onChange={toggleActive}
                  disabled={busy === 'status'}
                />
              </div>
              <div style={{ height: 1, background: colors.border }} />
              <KeyValue label="Slug" value={collection?.slug ? `/${collection.slug}` : '—'} mono />
              <KeyValue label="Display order" value={collection?.displayOrder ?? '—'} />
              <KeyValue label="Products" value={members.length} />
              <Button
                variant="secondary"
                size="sm"
                icon="edit"
                fullWidth
                onClick={() => {
                  setRenameValue(collection?.name || '');
                  setRenameError('');
                  setRenameOpen(true);
                }}
              >
                Rename tab
              </Button>
            </div>
          </Panel>

          <Panel bare>
            <div style={{ padding: 20, background: colors.champagne, borderTop: `1px solid #EBD9B8` }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Icon name="sparkle" size={16} style={{ color: colors.goldDeep, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.7, color: colors.inkSoft }}>
                  Hiding a membership keeps the product in the collection but removes it from the public tab. Removing a
                  membership never deletes the product.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={renameOpen}
        onClose={renaming ? undefined : () => setRenameOpen(false)}
        title="Rename collection"
        width={460}
        closeOnBackdrop={!renaming}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameOpen(false)} disabled={renaming}>Cancel</Button>
            <Button type="submit" form="rename-collection-form" loading={renaming}>Save name</Button>
          </>
        }
      >
        <form id="rename-collection-form" onSubmit={rename} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {renameError ? <Alert tone="error">{renameError}</Alert> : null}
          <Field label="Collection name" required>
            <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} autoFocus maxLength={120} />
          </Field>
          <div style={{ fontSize: 11, color: colors.faint, lineHeight: 1.5 }}>
            The public slug is generated and validated by the backend.
          </div>
        </form>
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a product"
        subtitle="Search the catalogue and add a piece to this tab."
        width={640}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SearchBar value={productSearch} onChange={setProductSearch} placeholder="Search products…" autoFocus />
          <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {productsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                <span style={{ fontSize: 12, color: colors.muted }}>Loading products…</span>
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                compact
                icon="gem"
                title="No products found"
                description={productSearch ? 'Try a different search term.' : 'Add products to the catalogue first.'}
              />
            ) : (
              products.map((product) => {
                const productId = product.id || product._id;
                const already = memberIds.has(productId);
                return (
                  <div
                    key={productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 10px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: radii.md,
                      background: colors.surface,
                    }}
                  >
                    <Thumb
                      src={product.images?.[0]?.publicUrl}
                      alt={product.name}
                      icon="gem"
                      size={44}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>{product.name}</div>
                      <div style={{ fontSize: 10.5, color: colors.muted, marginTop: 2 }}>
                        {formatINR(product.pricePaise)} · {product.category?.name || 'Uncategorised'}
                      </div>
                    </div>
                    {already ? (
                      <Badge tone="success">In collection</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="plus"
                        loading={addingId === productId}
                        onClick={() => addProduct(product)}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={removeProduct}
        title="Remove from this collection?"
        message={
          removeTarget
            ? `The product will be removed only from “${collection?.name}”. It will remain in the catalogue and any other collections.`
            : ''
        }
        confirmLabel="Remove membership"
        loading={removing}
        danger={false}
      />
    </PageShell>
  );
}
