import { useCallback, useEffect, useRef, useState } from 'react';
import { extractList } from '../lib/api.js';

const EMPTY_PAGINATION = { page: 1, limit: 20, totalItems: 0, totalPages: 0 };

/**
 * Small paginated-list hook so every admin table behaves the same:
 * loading, error, reload and defensive list-envelope handling.
 */
export default function usePaginatedList(fetcher, params = {}) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetcherRef
      .current(params)
      .then((response) => {
        if (!active) return;
        const { items: nextItems, pagination: nextPagination } = extractList(response?.data);
        setItems(nextItems);
        const totalItems = nextPagination?.totalItems ?? nextItems.length;
        const limit = nextPagination?.limit ?? params.limit ?? 20;
        setPagination({
          page: nextPagination?.page ?? params.page ?? 1,
          limit,
          totalItems,
          totalPages: nextPagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit)),
        });
      })
      .catch((err) => {
        if (!active) return;
        setItems([]);
        setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paramsKey, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return { items, pagination, loading, error, reload, setItems, setPagination };
}
