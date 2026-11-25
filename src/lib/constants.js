export const ORDER_STATUSES = ['Processing', 'Accepted', 'Shipping', 'Delivered', 'Cancelled'];
export const PAYMENT_STATUSES = ['Pending', 'Paid'];
export const REVIEW_STATUSES = ['Pending', 'Approved', 'Rejected', 'Hidden'];
export const INQUIRY_STATUSES = ['New', 'Contacted', 'Resolved', 'Rejected'];
export const AVAILABILITY = ['Available', 'Unavailable'];
export const DISCOUNT_TYPES = ['Percentage', 'Flat'];

export const STATUS_TONES = {
  // Orders
  Placed: 'warning',
  Confirmed: 'info',
  Processing: 'warning',
  Accepted: 'info',
  Shipping: 'gold',
  Shipped: 'gold',
  Delivered: 'success',
  Cancelled: 'danger',
  // Payments
  Pending: 'warning',
  Paid: 'success',
  // Reviews
  Approved: 'success',
  Rejected: 'danger',
  Hidden: 'neutral',
  // Inquiries
  New: 'warning',
  Contacted: 'info',
  Resolved: 'success',
  // Catalogue
  Available: 'success',
  Unavailable: 'danger',
  Active: 'success',
  Inactive: 'neutral',
};

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/categories', label: 'Categories', icon: 'category' },
      { to: '/products', label: 'Products', icon: 'gem' },
      { to: '/collections', label: 'Aura Collections', icon: 'layers' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/orders', label: 'Orders', icon: 'receipt' },
      { to: '/customers', label: 'Customers', icon: 'users' },
      { to: '/coupons', label: 'Coupons', icon: 'ticket' },
      { to: '/delivery', label: 'Delivery Rules', icon: 'truck' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { to: '/reviews', label: 'Reviews', icon: 'star' },
      { to: '/inquiries', label: 'Inquiries', icon: 'inbox' },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', label: 'Settings', icon: 'settings' }],
  },
];

export const INDIAN_STATES = [
  ['Andhra Pradesh', 'AP'],
  ['Arunachal Pradesh', 'AR'],
  ['Assam', 'AS'],
  ['Bihar', 'BR'],
  ['Chhattisgarh', 'CG'],
  ['Goa', 'GA'],
  ['Gujarat', 'GJ'],
  ['Haryana', 'HR'],
  ['Himachal Pradesh', 'HP'],
  ['Jharkhand', 'JH'],
  ['Karnataka', 'KA'],
  ['Kerala', 'KL'],
  ['Madhya Pradesh', 'MP'],
  ['Maharashtra', 'MH'],
  ['Manipur', 'MN'],
  ['Meghalaya', 'ML'],
  ['Mizoram', 'MZ'],
  ['Nagaland', 'NL'],
  ['Odisha', 'OD'],
  ['Punjab', 'PB'],
  ['Rajasthan', 'RJ'],
  ['Sikkim', 'SK'],
  ['Tamil Nadu', 'TN'],
  ['Telangana', 'TS'],
  ['Tripura', 'TR'],
  ['Uttar Pradesh', 'UP'],
  ['Uttarakhand', 'UK'],
  ['West Bengal', 'WB'],
  ['Andaman and Nicobar Islands', 'AN'],
  ['Chandigarh', 'CH'],
  ['Dadra and Nagar Haveli and Daman and Diu', 'DH'],
  ['Delhi', 'DL'],
  ['Jammu and Kashmir', 'JK'],
  ['Ladakh', 'LA'],
  ['Lakshadweep', 'LD'],
  ['Puducherry', 'PY'],
].map(([name, code]) => ({ name, code }));

export const SORT_OPTIONS = [
  { value: '', label: 'Default order' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'display_order', label: 'Display order' },
];
