const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const TOKEN_KEY = 'ga_admin_token';
const ADMIN_KEY = 'ga_admin_profile';
const EXPIRES_KEY = 'ga_admin_expires_at';

const memory = new Map();

function read(store, key) {
  try {
    return store.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(store, key, value) {
  try {
    store.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

function remove(store, key) {
  try {
    store.removeItem(key);
  } catch {
    memory.delete(key);
  }
}

export const session = {
  getToken() {
    return read(window.sessionStorage, TOKEN_KEY);
  },
  setSession({ token, admin, expiresIn }) {
    const ttl = Number(expiresIn) > 0 ? Number(expiresIn) : 3600;
    write(window.sessionStorage, TOKEN_KEY, token);
    write(window.sessionStorage, ADMIN_KEY, JSON.stringify(admin ?? null));
    write(window.sessionStorage, EXPIRES_KEY, String(Date.now() + ttl * 1000));
  },
  getAdmin() {
    try {
      return JSON.parse(read(window.sessionStorage, ADMIN_KEY) || 'null');
    } catch {
      return null;
    }
  },
  getExpiresAt() {
    return Number(read(window.sessionStorage, EXPIRES_KEY) || 0);
  },
  clear() {
    remove(window.sessionStorage, TOKEN_KEY);
    remove(window.sessionStorage, ADMIN_KEY);
    remove(window.sessionStorage, EXPIRES_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || [];
  }
}

function withParams(path, params) {
  if (!params) return path;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, value);
  });
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

async function request(path, { method = 'GET', body, params, headers = {} } = {}) {
  const token = session.getToken();
  const finalHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${withParams(path, params)}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the API. Confirm the backend is running and VITE_API_BASE_URL is correct.', 0);
  }

  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else if (contentType.includes('text/')) {
    payload = await response.text().catch(() => null);
  }

  if (!response.ok) {
    if (response.status === 401 && token && !path.endsWith('/login')) {
      window.dispatchEvent(new CustomEvent('ga:unauthorized'));
    }
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      (response.status === 404
        ? 'This endpoint is not available on the server yet.'
        : `Request failed (${response.status})`);
    throw new ApiError(message, response.status, payload?.errors);
  }

  return {
    data: payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload,
    message: payload && typeof payload === 'object' ? payload.message : undefined,
    raw: payload,
  };
}

export const api = {
  baseUrl: BASE_URL,
  request,

  health: () => request('/health'),
  readiness: () => request('/health/ready'),

  auth: {
    login: (email, password) => request('/admin/auth/login', { method: 'POST', body: { email, password } }),
    me: () => request('/admin/auth/me'),
    changePassword: (currentPassword, newPassword) =>
      request('/admin/auth/change-password', { method: 'PATCH', body: { currentPassword, newPassword } }),
    logout: () => request('/admin/auth/logout', { method: 'POST' }),
  },

  categories: {
    list: (params) => request('/admin/categories', { params }),
    get: (id) => request(`/admin/categories/${id}`),
    create: (body) => request('/admin/categories', { method: 'POST', body }),
    update: (id, body) => request(`/admin/categories/${id}`, { method: 'PATCH', body }),
    setStatus: (id, isActive) => request(`/admin/categories/${id}/status`, { method: 'PATCH', body: { isActive } }),
    reorder: (items) => request('/admin/categories/reorder', { method: 'PATCH', body: { items } }),
    remove: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
  },

  products: {
    list: (params) => request('/admin/products', { params }),
    get: (id) => request(`/admin/products/${id}`),
    create: (body) => request('/admin/products', { method: 'POST', body }),
    update: (id, body) => request(`/admin/products/${id}`, { method: 'PATCH', body }),
    setStatus: (id, isActive) => request(`/admin/products/${id}/status`, { method: 'PATCH', body: { isActive } }),
    setAvailability: (id, availability) =>
      request(`/admin/products/${id}/availability`, { method: 'PATCH', body: { availability } }),
    reorder: (id, displayOrder) =>
      request(`/admin/products/${id}/reorder`, { method: 'PATCH', body: { displayOrder } }),
    remove: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  },

  collections: {
    list: (params) => request('/admin/collections', { params }),
    get: (id) => request(`/admin/collections/${id}`),
    create: (body) => request('/admin/collections', { method: 'POST', body }),
    update: (id, body) => request(`/admin/collections/${id}`, { method: 'PATCH', body }),
    setStatus: (id, isActive) =>
      request(`/admin/collections/${id}/status`, { method: 'PATCH', body: { isActive } }),
    reorder: (items) => request('/admin/collections/reorder', { method: 'PATCH', body: { items } }),
    remove: (id) => request(`/admin/collections/${id}`, { method: 'DELETE' }),
    addProduct: (id, body) => request(`/admin/collections/${id}/products`, { method: 'POST', body }),
    updateProduct: (id, productId, body) =>
      request(`/admin/collections/${id}/products/${productId}`, { method: 'PATCH', body }),
    reorderProducts: (id, items) =>
      request(`/admin/collections/${id}/products/reorder`, { method: 'PATCH', body: { items } }),
    removeProduct: (id, productId) =>
      request(`/admin/collections/${id}/products/${productId}`, { method: 'DELETE' }),
  },

  uploads: {
    presign: (body) => request('/admin/uploads/presign', { method: 'POST', body }),
    complete: (objectKey) => request('/admin/uploads/complete', { method: 'POST', body: { objectKey } }),
    remove: (objectKey) => request('/admin/uploads', { method: 'DELETE', body: { objectKey } }),
  },

  delivery: {
    list: (params) => request('/admin/delivery/states', { params }),
    get: (stateCode) => request(`/admin/delivery/states/${stateCode}`),
    upsert: (stateCode, body) => request(`/admin/delivery/states/${stateCode}`, { method: 'PUT', body }),
    setStatus: (stateCode, isDeliveryEnabled) =>
      request(`/admin/delivery/states/${stateCode}/status`, { method: 'PATCH', body: { isDeliveryEnabled } }),
    addSlab: (stateCode, body) =>
      request(`/admin/delivery/states/${stateCode}/slabs`, { method: 'POST', body }),
    updateSlab: (stateCode, slabId, body) =>
      request(`/admin/delivery/states/${stateCode}/slabs/${slabId}`, { method: 'PATCH', body }),
    reorderSlabs: (stateCode, items) =>
      request(`/admin/delivery/states/${stateCode}/slabs/reorder`, { method: 'PATCH', body: { items } }),
    removeSlab: (stateCode, slabId) =>
      request(`/admin/delivery/states/${stateCode}/slabs/${slabId}`, { method: 'DELETE' }),
    zones: {
      list: (params) => request('/admin/delivery/zones', { params }),
      get: (zoneId) => request(`/admin/delivery/zones/${zoneId}`),
      create: (body) => request('/admin/delivery/zones', { method: 'POST', body }),
      update: (zoneId, body) => request(`/admin/delivery/zones/${zoneId}`, { method: 'PUT', body }),
      setStatus: (zoneId, isActive) =>
        request(`/admin/delivery/zones/${zoneId}/status`, { method: 'PATCH', body: { isActive } }),
      remove: (zoneId) => request(`/admin/delivery/zones/${zoneId}`, { method: 'DELETE' }),
    },
  },

  coupons: {
    list: (params) => request('/admin/coupons', { params }),
    get: (id) => request(`/admin/coupons/${id}`),
    create: (body) => request('/admin/coupons', { method: 'POST', body }),
    update: (id, body) => request(`/admin/coupons/${id}`, { method: 'PATCH', body }),
    setStatus: (id, isActive) => request(`/admin/coupons/${id}/status`, { method: 'PATCH', body: { isActive } }),
    redemptions: (id, params) => request(`/admin/coupons/${id}/redemptions`, { params }),
  },

  orders: {
    list: (params) => request('/admin/orders', { params }),
    get: (id) => request(`/admin/orders/${id}`),
    setStatus: (id, body) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body }),
    addNote: (id, note) => request(`/admin/orders/${id}/notes`, { method: 'POST', body: { note } }),
    recordPayment: (id, body) => request(`/admin/orders/${id}/payment`, { method: 'PATCH', body }),
    invoice: async (id) => {
      const token = session.getToken();
      let response;
      try {
        response = await fetch(`${BASE_URL}/admin/orders/${id}/invoice`, {
          headers: { Accept: 'application/pdf, application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
      } catch {
        throw new ApiError('Cannot reach the API to build the invoice.', 0);
      }
      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        throw new ApiError(payload?.message || `Invoice request failed (${response.status})`, response.status);
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        return { type: 'pdf', blob: await response.blob() };
      }
      const payload = await response.json();
      return { type: 'json', data: payload?.data ?? payload };
    },
  },

  customers: {
    list: (params) => request('/admin/customers', { params }),
    get: (id) => request(`/admin/customers/${id}`),
    update: (id, body) => request(`/admin/customers/${id}`, { method: 'PATCH', body }),
    orders: (id, params) => request(`/admin/customers/${id}/orders`, { params }),
  },

  reviews: {
    list: (params) => request('/admin/reviews', { params }),
    get: (id) => request(`/admin/reviews/${id}`),
    moderate: (id, status) => request(`/admin/reviews/${id}/moderation`, { method: 'PATCH', body: { status } }),
    reorder: (items) => request('/admin/reviews/reorder', { method: 'PATCH', body: { items } }),
  },

  inquiries: {
    list: (params) => request('/admin/customer-inquiries', { params }),
    get: (id) => request(`/admin/customer-inquiries/${id}`),
    setStatus: (id, status, note) =>
      request(`/admin/customer-inquiries/${id}/status`, { method: 'PATCH', body: { status, ...(note ? { note } : {}) } }),
    addNote: (id, note) =>
      request(`/admin/customer-inquiries/${id}/notes`, { method: 'POST', body: { note } }),
  },
};

/**
 * Upload one image through the documented R2 flow:
 * presign -> PUT to R2 -> complete -> trusted image metadata.
 */
export async function uploadImage(file, purpose = 'product') {
  const presigned = await api.uploads.presign({
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    purpose,
  });

  // The API request helper unwraps one `data` envelope, but tolerate a proxy or
  // older backend that wraps the successful response more than once.
  let upload = presigned;
  for (let depth = 0; depth < 3 && upload; depth += 1) {
    if (upload.uploadUrl && upload.objectKey) break;
    upload = upload.data || upload.upload || upload.raw?.data || upload.raw || null;
  }
  upload ||= {};
  if (!upload.uploadUrl || !upload.objectKey) {
    throw new ApiError('The upload service returned an incomplete presigned response.', 500);
  }

  let putResponse;
  try {
    putResponse = await fetch(upload.uploadUrl, {
      method: upload.method || 'PUT',
      headers: { 'Content-Type': file.type, ...(upload.requiredHeaders || {}) },
      body: file,
    });
  } catch {
    throw new ApiError('The image upload to storage failed. Check the R2 CORS configuration.', 0);
  }
  if (!putResponse.ok) {
    throw new ApiError(`Image upload failed (${putResponse.status}).`, putResponse.status);
  }

  const completed = await api.uploads.complete(upload.objectKey);
  const meta = completed.data?.image || completed.data || {};
  return {
    objectKey: meta.objectKey || upload.objectKey,
    publicUrl: meta.publicUrl || upload.publicUrl,
    contentType: meta.contentType || file.type,
    sizeBytes: meta.sizeBytes || file.size,
    altText: '',
    displayOrder: 0,
  };
}

const LIST_KEYS = [
  'items',
  'products',
  'categories',
  'collections',
  'orders',
  'customers',
  'reviews',
  'inquiries',
  'customerInquiries',
  'coupons',
  'states',
  'zones',
  'redemptions',
  'slabs',
];

/** Accepts several reasonable list envelopes and always returns { items, pagination }. */
export function extractList(data) {
  if (!data) return { items: [], pagination: null };
  if (Array.isArray(data)) return { items: data, pagination: null };
  const key = LIST_KEYS.find((candidate) => Array.isArray(data[candidate]));
  const items = key ? data[key] : [];
  return {
    items,
    pagination: data.pagination || null,
  };
}

export { BASE_URL };
