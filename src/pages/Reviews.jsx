import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { colors, fonts, radii } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { formatDateTime, initials, truncate } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';
import usePaginatedList from '../hooks/usePaginatedList.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import Panel from '../components/ui/Panel.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import DataTable, { IconButton, TableActions } from '../components/ui/DataTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import StarRating from '../components/ui/StarRating.jsx';
import { Input } from '../components/ui/Field.jsx';
import { Divider, KeyValue, PageShell } from '../components/ui/Media.jsx';
import Icon from '../components/Icon.jsx';

export default function Reviews() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || 'Pending');
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(null);
  const [reordering, setReordering] = useState(false);

  const params = {
    page,
    limit: 20,
    ...(status ? { status } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const { items, pagination, loading, error, reload } = usePaginatedList(api.reviews.list, params);

  useEffect(() => {
    document.title = 'Reviews · Golden Aura Admin';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [status, from, to]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const changeStatus = (value) => {
    setStatus(value);
    updateParam('status', value === 'Pending' ? '' : value);
  };

  const clearDates = () => {
    setFrom('');
    setTo('');
    const next = new URLSearchParams(searchParams);
    next.delete('from');
    next.delete('to');
    setSearchParams(next, { replace: true });
  };

  const moderate = async (review, nextStatus) => {
    const reviewId = review.id || review._id;
    setBusy(reviewId);
    try {
      await api.reviews.moderate(reviewId, nextStatus);
      toast.success(`Review ${nextStatus.toLowerCase()}.`);
      if (selected && (selected.id || selected._id) === reviewId) {
        setSelected((current) => (current ? { ...current, status: nextStatus } : current));
      }
      reload();
    } catch (moderationError) {
      toast.error(moderationError.message);
    } finally {
      setBusy(null);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setReordering(true);
    try {
      await api.reviews.reorder(
        reordered.map((review, itemIndex) => ({
          reviewId: review.id || review._id,
          displayOrder: itemIndex + 1,
        })),
      );
      toast.success('Public review order updated.');
      reload();
    } catch (orderError) {
      toast.error(orderError.message);
    } finally {
      setReordering(false);
    }
  };

  const columns = [
    {
      key: 'reviewer',
      header: 'Reviewer',
      render: (review) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: colors.champagne,
              color: colors.goldDeep,
              border: '1px solid #EBD9B8',
              display: 'grid',
              placeItems: 'center',
              fontFamily: fonts.display,
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials(review.customerName)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: colors.ink }}>{review.customerName || 'Customer'}</div>
            <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>{review.location || 'No location'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      width: 120,
      render: (review) => <StarRating rating={review.rating} size={13} showValue />,
    },
    {
      key: 'text',
      header: 'Review',
      render: (review) => (
        <span
          style={{
            display: 'block',
            maxWidth: 360,
            fontSize: 12,
            color: colors.inkSoft,
            lineHeight: 1.55,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          “{truncate(review.reviewText || review.text || '', 120)}”
        </span>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (review) => (
        <span style={{ fontSize: 11, color: colors.muted }}>{formatDateTime(review.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (review) => <StatusBadge status={review.status} />,
    },
    ...(status === 'Approved'
      ? [
          {
            key: 'order',
            header: 'Order',
            align: 'center',
            width: 70,
            render: (review) => (
              <span style={{ fontSize: 11.5, color: colors.muted }}>{review.displayOrder ?? '—'}</span>
            ),
          },
        ]
      : []),
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 140,
      render: (review, index) => (
        <TableActions>
          {status === 'Approved' ? (
            <>
              <IconButton
                icon="chevronUp"
                label="Move up"
                disabled={index === 0 || reordering}
                onClick={() => move(index, -1)}
              />
              <IconButton
                icon="chevronDown"
                label="Move down"
                disabled={index === items.length - 1 || reordering}
                onClick={() => move(index, 1)}
              />
            </>
          ) : null}
          {review.status !== 'Approved' ? (
            <IconButton
              icon="check"
              label="Approve review"
              tone="gold"
              disabled={busy === (review.id || review._id)}
              onClick={() => moderate(review, 'Approved')}
            />
          ) : null}
          {review.status !== 'Rejected' ? (
            <IconButton
              icon="close"
              label="Reject review"
              tone="danger"
              disabled={busy === (review.id || review._id)}
              onClick={() => moderate(review, 'Rejected')}
            />
          ) : null}
          <IconButton icon="eye" label="Open review" onClick={() => setSelected(review)} />
        </TableActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Engagement"
        title="Reviews"
        subtitle="Public submissions arrive as Pending. Approve the voices that belong on the storefront and control their order."
        actions={
          <>
            <Badge tone="gold" dot={false}>{pagination.totalItems} in view</Badge>
            <Button variant="secondary" icon="refresh" onClick={reload} loading={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <Panel bare>
        <div style={{ padding: '14px 18px 0' }}>
          <Tabs
            value={status}
            onChange={changeStatus}
            items={[
              { value: 'Pending', label: 'Pending' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Rejected', label: 'Rejected' },
              { value: 'Hidden', label: 'Hidden' },
              { value: '', label: 'All reviews' },
            ]}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ flex: '0 1 165px', minWidth: 150 }}>
            <Input
              type="date"
              aria-label="Reviews from date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                updateParam('from', event.target.value);
              }}
              style={{ fontSize: 12, padding: '9px 10px' }}
            />
          </div>
          <div style={{ flex: '0 1 165px', minWidth: 150 }}>
            <Input
              type="date"
              aria-label="Reviews to date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                updateParam('to', event.target.value);
              }}
              style={{ fontSize: 12, padding: '9px 10px' }}
            />
          </div>
          {from || to ? (
            <Button size="sm" variant="ghost" onClick={clearDates}>
              Clear dates
            </Button>
          ) : null}
          <span style={{ marginLeft: 'auto', fontSize: 10.5, color: colors.faint }}>
            New public submissions always start as Pending.
          </span>
        </div>

        {error ? (
          <div style={{ padding: 18 }}>
            <Alert
              tone="error"
              title="Reviews could not be loaded"
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
          minWidth={920}
          rowKey={(review) => review.id || review._id}
          onRowClick={(review) => setSelected(review)}
          empty={
            !loading ? (
              <EmptyState
                icon="star"
                title={status ? `No ${status.toLowerCase()} reviews` : 'No reviews yet'}
                description={
                  status === 'Pending'
                    ? 'When customers submit feedback, it will wait here for moderation.'
                    : 'Published and moderated reviews will appear in this view.'
                }
                action={
                  status !== '' ? (
                    <Button size="sm" variant="secondary" onClick={() => changeStatus('')}>
                      View all reviews
                    </Button>
                  ) : null
                }
              />
            ) : null
          }
          footer={<div style={{ padding: '0 16px' }}><Pagination {...pagination} onChange={setPage} /></div>}
        />
      </Panel>

      <div style={{ marginTop: 14, fontSize: 10.5, color: colors.faint, lineHeight: 1.6 }}>
        Only Approved reviews appear publicly. Use display order in the Approved view to curate the testimonial order;
        Hidden removes a review from the storefront without rejecting it.
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Review"
        subtitle={selected ? `Submitted ${formatDateTime(selected.createdAt)}` : undefined}
        width={620}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected?.status !== 'Hidden' ? (
              <Button
                variant="secondary"
                icon="eyeOff"
                loading={busy === (selected?.id || selected?._id)}
                onClick={() => moderate(selected, 'Hidden')}
              >
                Hide
              </Button>
            ) : null}
            {selected?.status !== 'Rejected' ? (
              <Button
                variant="dangerGhost"
                icon="close"
                loading={busy === (selected?.id || selected?._id)}
                onClick={() => moderate(selected, 'Rejected')}
              >
                Reject
              </Button>
            ) : null}
            {selected?.status !== 'Approved' ? (
              <Button
                icon="check"
                loading={busy === (selected?.id || selected?._id)}
                onClick={() => moderate(selected, 'Approved')}
              >
                Approve
              </Button>
            ) : null}
          </>
        }
      >
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: colors.champagne,
                    border: '1px solid #EBD9B8',
                    color: colors.goldDeep,
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: fonts.display,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {initials(selected.customerName)}
                </span>
                <div>
                  <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.ink }}>
                    {selected.customerName}
                  </div>
                  <div style={{ fontSize: 11, color: colors.faint }}>{selected.location || 'No location'}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <StarRating rating={selected.rating} size={18} showValue />

            <div
              style={{
                position: 'relative',
                padding: '18px 20px',
                background: colors.bgAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
              }}
            >
              <Icon
                name="star"
                size={18}
                filled
                style={{ color: colors.gold, opacity: 0.45, marginBottom: 8 }}
              />
              <p style={{ margin: 0, fontFamily: fonts.display, fontSize: 20, lineHeight: 1.6, color: colors.inkSoft }}>
                {selected.reviewText || selected.text}
              </p>
            </div>

            <Divider />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26 }}>
              <KeyValue label="Submitted" value={formatDateTime(selected.createdAt)} />
              <KeyValue label="Moderated" value={formatDateTime(selected.moderatedAt)} />
              <KeyValue label="Display order" value={selected.displayOrder ?? '—'} />
              <KeyValue label="Review ID" value={selected.id || selected._id} mono />
            </div>
          </div>
        ) : null}
      </Modal>
    </PageShell>
  );
}
