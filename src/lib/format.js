const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format integer paise as INR. */
export function formatINR(paise) {
  if (paise === null || paise === undefined || Number.isNaN(Number(paise))) return '—';
  return inrFormatter.format(Number(paise) / 100);
}

/** Format a number of rupees as INR (for previews only). */
export function formatRupees(value) {
  if (value === null || value === undefined || value === '') return '—';
  return inrFormatter.format(Number(value));
}

/** paise -> plain rupee string for input fields. */
export function paiseToRupees(paise) {
  if (paise === null || paise === undefined || Number.isNaN(Number(paise))) return '';
  const rupees = Number(paise) / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

/** rupee input string -> integer paise (or null when blank). */
export function rupeesToPaise(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const amount = Number.parseFloat(String(value).replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function timeAgo(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(seconds, 'second');
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'GA';
}

export function titleCase(value = '') {
  return String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function truncate(value = '', length = 90) {
  const text = String(value);
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

export function filenameFromUrl(url = '') {
  try {
    const clean = new URL(url, 'https://example.com').pathname;
    return decodeURIComponent(clean.split('/').filter(Boolean).pop() || 'image');
  } catch {
    return 'image';
  }
}
