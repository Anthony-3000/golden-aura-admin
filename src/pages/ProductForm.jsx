import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fonts } from '../lib/theme.js';
import { api, extractList } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { AVAILABILITY } from '../lib/constants.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import { Field, FormGrid, Input, Select, Textarea } from '../components/ui/Field.jsx';
import MoneyInput from '../components/ui/MoneyInput.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import ImageUploader from '../components/ui/ImageUploader.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { KeyValue, PageShell } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  images: [],
  pricePaise: null,
  originalPricePaise: null,
  material: '',
  size: '',
  availability: 'Available',
  isFeatured: false,
  displayOrder: 0,
  isActive: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id && id !== 'new');

  const [form, setForm] = useState(emptyForm);
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    document.title = isEdit ? 'Edit product · Golden Aura Admin' : 'New product · Golden Aura Admin';
  }, [isEdit]);

  useEffect(() => {
    let active = true;
    api.categories
      .list({ page: 1, limit: 100 })
      .then((response) => active && setCategories(extractList(response.data).items))
      .catch(() => active && setCategories([]));

    if (!isEdit) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    api.products
      .get(id)
      .then((response) => {
        if (!active) return;
        const data = response.data?.product || response.data;
        setProduct(data);
        setForm({
          name: data.name || '',
          category: data.category?.id || data.category?._id || data.category || '',
          description: data.description || '',
          images: (data.images || []).map((image, index) => ({ ...image, displayOrder: index + 1 })),
          pricePaise: data.pricePaise ?? null,
          originalPricePaise: data.originalPricePaise ?? null,
          material: data.material || '',
          size: data.size || '',
          availability: data.availability || 'Available',
          isFeatured: Boolean(data.isFeatured),
          displayOrder: data.displayOrder ?? 0,
          isActive: data.isActive ?? true,
        });
        setLoadError(null);
      })
      .catch((error) => active && setLoadError(error))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const set = (patch) => setForm((state) => ({ ...state, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.name.trim()) return setFormError('A product name is required.');
    if (!form.category) return setFormError('Choose the category this product belongs to.');
    if (!form.description.trim()) return setFormError('A product description is required.');
    if (!form.images.length) return setFormError('Add at least one product image.');
    if (form.pricePaise === null || form.pricePaise < 0) return setFormError('Enter a valid selling price.');
    if (form.originalPricePaise !== null && form.originalPricePaise < form.pricePaise) {
      return setFormError('The original price should be greater than or equal to the selling price.');
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      images: form.images.map((image, index) => ({
        objectKey: image.objectKey,
        publicUrl: image.publicUrl,
        altText: image.altText || form.name.trim(),
        displayOrder: index + 1,
        ...(image.contentType ? { contentType: image.contentType } : {}),
        ...(image.sizeBytes ? { sizeBytes: image.sizeBytes } : {}),
      })),
      pricePaise: form.pricePaise,
      originalPricePaise: form.originalPricePaise,
      material: form.material.trim(),
      size: form.size.trim(),
      availability: form.availability,
      isFeatured: form.isFeatured,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.products.update(id, payload);
        toast.success('Product updated.');
      } else {
        await api.products.create(payload);
        toast.success('Product created.');
      }
      navigate('/products');
    } catch (saveError) {
      setFormError(saveError.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Fetching the piece…" />;

  if (loadError) {
    return (
      <PageShell>
        <PageHeader eyebrow="Catalogue" title="Product" />
        <Alert
          tone="error"
          title="This product could not be loaded"
          action={
            <Button size="sm" variant="secondary" icon="arrowLeft" onClick={() => navigate('/products')}>
              Back to products
            </Button>
          }
        >
          {loadError.message}
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow={isEdit ? 'Edit product' : 'New product'}
        title={isEdit ? form.name || 'Edit product' : 'Add a product'}
        subtitle="Every field here is curated by hand. Prices are stored as integer paise; the interface converts from rupees."
        actions={
          <>
            <Button variant="secondary" icon="arrowLeft" onClick={() => navigate('/products')} disabled={saving}>
              Back
            </Button>
            <Button type="submit" form="product-form" icon="check" loading={saving}>
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      />

      {formError ? (
        <Alert tone="error" title="Please check the form" style={{ marginBottom: 18 }}>
          {formError}
        </Alert>
      ) : null}

      <form id="product-form" onSubmit={submit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, 0.75fr)',
            gap: 18,
            alignItems: 'start',
          }}
          className="ga-product-grid"
        >
          <style>{'@media (max-width: 980px){ .ga-product-grid { grid-template-columns: 1fr !important; } }'}</style>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Panel title="The piece" subtitle="Name, category and the story shown to customers.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Product name" required htmlFor="product-name">
                  <Input
                    id="product-name"
                    value={form.name}
                    onChange={(event) => set({ name: event.target.value })}
                    placeholder="Golden Pearl Necklace"
                    maxLength={160}
                  />
                </Field>

                <FormGrid>
                  <Field label="Category" required>
                    <Select value={form.category} onChange={(event) => set({ category: event.target.value })}>
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id || category._id} value={category.id || category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Material" hint="A simple text value, not a variant system.">
                    <Input
                      value={form.material}
                      onChange={(event) => set({ material: event.target.value })}
                      placeholder="Gold-plated"
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Size" hint="Free Size, Adjustable, 6, 7, Small…">
                    <Input
                      value={form.size}
                      onChange={(event) => set({ size: event.target.value })}
                      placeholder="Free Size"
                      maxLength={80}
                    />
                  </Field>
                </FormGrid>

                <Field label="Description" required>
                  <Textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) => set({ description: event.target.value })}
                    placeholder="Elegant pearl necklace with a warm golden finish…"
                    maxLength={4000}
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Imagery" subtitle="Multiple images are supported. The first image is the primary image. Reorder with the arrows.">
              <ImageUploader
                images={form.images}
                onChange={(images) => set({ images })}
                purpose="product"
                max={12}
                helper="JPEG, PNG, WebP or AVIF · up to 8 MB each. Add alt text for accessibility."
              />
            </Panel>

            <Panel title="Pricing" subtitle="Monetary values are sent to the backend as integer paise.">
              <FormGrid>
                <Field label="Selling price" required hint="The price customers pay.">
                  <MoneyInput
                    valuePaise={form.pricePaise}
                    onChangePaise={(pricePaise) => set({ pricePaise })}
                    placeholder="1,499"
                  />
                </Field>
                <Field label="Original / MRP" hint="Optional. Shown struck through when higher than the selling price.">
                  <MoneyInput
                    valuePaise={form.originalPricePaise}
                    onChangePaise={(originalPricePaise) => set({ originalPricePaise })}
                    placeholder="1,999"
                  />
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, fontSize: 11, color: colors.faint }}>
                <Icon name="sparkle" size={13} style={{ color: colors.gold }} />
                All totals are recalculated by the backend at checkout; this is catalogue pricing only.
              </div>
            </Panel>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Panel title="Merchandising" subtitle="How the piece behaves in the catalogue.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field label="Availability" hint="Unavailable products cannot be ordered.">
                  <Select
                    value={form.availability}
                    onChange={(event) => set({ availability: event.target.value })}
                  >
                    {AVAILABILITY.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Display order" hint="Lower numbers appear first in listings.">
                  <Input
                    type="number"
                    min="0"
                    value={form.displayOrder}
                    onChange={(event) => set({ displayOrder: event.target.value })}
                  />
                </Field>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingBottom: 11,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>Featured piece</div>
                      <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
                        Highlights in merchandising surfaces.
                      </div>
                    </div>
                    <Toggle checked={form.isFeatured} onChange={(isFeatured) => set({ isFeatured })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>Active</div>
                      <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
                        Inactive products are hidden publicly.
                      </div>
                    </div>
                    <Toggle checked={form.isActive} onChange={(isActive) => set({ isActive })} />
                  </div>
                </div>
              </div>
            </Panel>

            {isEdit ? (
              <Panel title="Record" subtitle="Read-only identity from the backend.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <KeyValue label="Public slug" value={product?.slug ? `/${product.slug}` : '—'} mono />
                  <KeyValue
                    label="Product ID"
                    value={product?.id || product?._id}
                    mono
                  />
                  <KeyValue label="Created" value={formatDateTime(product?.createdAt)} />
                  <KeyValue label="Last updated" value={formatDateTime(product?.updatedAt)} />
                </div>
              </Panel>
            ) : (
              <Panel bare>
                <div
                  style={{
                    padding: 20,
                    background: colors.champagne,
                    border: '1px solid #EBD9B8',
                    borderRadius: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Icon name="sparkle" size={17} style={{ color: colors.goldDeep, marginTop: 1 }} />
                    <div>
                      <div style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink, fontWeight: 600 }}>
                        A note before saving
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 11.5, lineHeight: 1.65, color: colors.inkSoft }}>
                        Upload imagery before creating the product. If storage uploads are not yet available, use the
                        “Add by URL” fallback in the imagery panel.
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Button type="submit" loading={saving} fullWidth icon="check">
                {isEdit ? 'Save changes' : 'Create product'}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/products')} disabled={saving} fullWidth>
                Discard
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageShell>
  );
}
