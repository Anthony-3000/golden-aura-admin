import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { colors } from '../lib/theme.js';
import { api, extractList } from '../lib/api.js';
import { formatINR, truncate } from '../lib/format.js';
import { AVAILABILITY, SORT_OPTIONS } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import usePaginatedList from '../hooks/usePaginatedList.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import { Select } from '../components/ui/Field.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Alert from '../components/ui/Alert.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import { PageShell, StackedCell, Thumb } from '../components/ui/Media.jsx';

export default function Products() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || '');
  const [activeState, setActiveState] = useState(searchParams.get('active') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');

  const [categories, setCategories] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const params = {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category ? { category } : {}),
    ...(availability ? { availability } : {}),
    ...(activeState ? { isActive: activeState === 'active' } : {}),
    ...(sort ? { sort } : {}),
  };

  const { items, pagination, loading, error, reload } = usePaginatedList(api.products.list, params);

  useEffect(() => {
    document.title = 'Products · Golden Aura Admin';
  }, []);

  useEffect(() => {
    api.categories
      .list({ page: 1, limit: 100 })
      .then((response) => setCategories(extractList(response.data).items))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, availability, activeState, sort]);

  const selectFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const toggleAvailability = async (product) => {
    const id = product.id || product._id;
    const next = product.availability === 'Available' ? 'Unavailable' : 'Available';
    setBusyId(id);
    try {
      await api.products.setAvailability(id, next);
      toast.success(`${product.name} is now ${next.toLowerCase()}.`);
      reload();
    } catch (toggleError) {
      toast.error(toggleError.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (product) => {
    const id = product.id || product._id;
    setBusyId(id);
    try {
      await api.products.setStatus(id, !product.isActive);
      toast.success(`${product.name} is now ${!product.isActive ? 'active' : 'inactive'}.`);
      reload();
    } catch (toggleError) {
      toast.error(toggleError.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.products.remove(deleteTarget.id || deleteTarget._id);
      toast.success('Product deleted.');
      setDeleteTarget(null);
      reload();
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (product) => (
        <StackedCell
          media={
            <Thumb
              src={product.images?.[0]?.publicUrl}
              alt={product.images?.[0]?.altText || product.name}
              icon="gem"
              size={46}
            />
          }
          title={product.name}
          subtitle={product.category?.name || product.categoryName || 'Uncategorised'}
          meta={
            product.isFeatured ? (
              <Badge tone="gold" dot={false} style={{ fontSize: 9 }}>
                Featured
              </Badge>
            ) : null
          }
        />
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (product) => (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>
            {formatINR(product.pricePaise)}
          </div>
          {product.originalPricePaise ? (
            <div style={{ fontSize: 10.5, color: colors.faint, textDecoration: 'line-through' }}>
              {formatINR(product.originalPricePaise)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Material · Size',
      render: (product) => (
        <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.5, maxWidth: 190 }}>
          <div>{product.material || '— material —'}</div>
          <div>{product.size || '— size —'}</div>
        </div>
      ),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (product) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleAvailability(product);
          }}
          disabled={busyId === (product.id || product._id)}
          style={{ border: 0, background: 'transparent', padding: 0 }}
          title="Toggle availability"
        >
          <StatusBadge status={product.availability || 'Available'} />
        </button>
      ),
    },
    {
      key: 'active',
      header: 'Visible',
      render: (product) => (
        <Toggle
          checked={Boolean(product.isActive)}
          onChange={() => toggleActive(product)}
          disabled={busyId === (product.id || product._id)}
          size="sm"
        />
      ),
    },
    {
      key: 'order',
      header: 'Order',
      align: 'center',
      width: 64,
      render: (product) => <span style={{ fontSize: 12, color: colors.muted }}>{product.displayOrder ?? 0}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 104,
      render: (product) => (
        <TableActions>
          <IconButton icon="edit" label="Edit product" onClick={() => navigate(`/products/${product.id || product._id}`)} />
          <IconButton icon="trash" label="Delete product" tone="danger" onClick={() => setDeleteTarget(product)} />
        </TableActions>
      ),
    },
  ];

  const hasFilters = Boolean(debouncedSearch || category || availability || activeState || sort);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        subtitle="The full jewellery catalogue — pricing, imagery, availability and merchandising. Availability is controlled manually; there is no stock ledger."
        actions={
          <Button icon="plus" onClick={() => navigate('/products/new')}>
            Add product
          </Button>
        }
      />

      <Panel bare>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            padding: '16px 18px',
            borderBottom: `1px solid ${colors.border}`,
            alignItems: 'center',
          }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search name or description…"
            style={{ flex: '2 1 240px', maxWidth: 320 }}
          />
          <div style={{ flex: '1 1 150px', minWidth: 150 }}>
            <Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                selectFilter('category', event.target.value);
              }}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id || item._id} value={item.id || item._id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '0 1 140px', minWidth: 130 }}>
            <Select
              value={availability}
              onChange={(event) => {
                setAvailability(event.target.value);
                selectFilter('availability', event.target.value);
              }}
              aria-label="Filter by availability"
            >
              <option value="">Availability</option>
              {AVAILABILITY.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '0 1 130px', minWidth: 120 }}>
            <Select
              value={activeState}
              onChange={(event) => {
                setActiveState(event.target.value);
                selectFilter('active', event.target.value);
              }}
              aria-label="Filter by visibility"
            >
              <option value="">Visibility</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div style={{ flex: '0 1 170px', minWidth: 155 }}>
            <Select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                selectFilter('sort', event.target.value);
              }}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.filter((option) => option.value !== 'oldest').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          {hasFilters ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch('');
                setCategory('');
                setAvailability('');
                setActiveState('');
                setSort('');
                setSearchParams({}, { replace: true });
              }}
            >
              Clear
            </Button>
          ) : null}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge tone="gold" dot={false}>{pagination.totalItems} products</Badge>
            <Button size="sm" variant="ghost" icon="refresh" onClick={reload} loading={loading} />
          </div>
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Products could not be loaded"
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
          minWidth={940}
          rowKey={(product) => product.id || product._id}
          onRowClick={(product) => navigate(`/products/${product.id || product._id}`)}
          empty={
            !loading ? (
              <EmptyState
                icon="gem"
                title={hasFilters ? 'No products match these filters' : 'The catalogue is waiting'}
                description={
                  hasFilters
                    ? 'Try clearing a filter or searching for a different name.'
                    : 'Add the first piece to begin building the Golden Aura catalogue.'
                }
                action={
                  hasFilters ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSearch('');
                        setCategory('');
                        setAvailability('');
                        setActiveState('');
                        setSort('');
                        setSearchParams({}, { replace: true });
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button size="sm" icon="plus" onClick={() => navigate('/products/new')}>
                      Add the first product
                    </Button>
                  )
                }
              />
            ) : null
          }
          footer={<div style={{ padding: '0 16px' }}><Pagination {...pagination} onChange={setPage} /></div>}
        />

        <div style={{ padding: '12px 18px', borderTop: `1px solid ${colors.border}`, fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
          {truncate(
            'Unavailable products remain visible in the admin but cannot be ordered. Deactivate a product to hide it from the public catalogue; deactivation is preferred over deletion for products referenced by orders.',
            220,
          )}
        </div>
      </Panel>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this product?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” cannot be hard-deleted if historical orders reference it. Prefer deactivation. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete product"
        loading={deleting}
      />
    </PageShell>
  );
}
