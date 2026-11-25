const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  category: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.6" cy="7.6" r="1.4" />
    </>
  ),
  gem: (
    <>
      <path d="M6.2 3h11.6L21 9.2 12 21 3 9.2 6.2 3Z" />
      <path d="M3 9.2h18M9 3l3 6.2L15 3M12 21 9 9.2M12 21l3-11.8" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2.8 9 5.1-9 5.1-9-5.1 9-5.1Z" />
      <path d="m3 12.9 9 5.1 9-5.1M3 17.9l9 5.1 9-5.1" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 2.8h14v18.4l-2.4-1.6-2.3 1.6-2.3-1.6-2.3 1.6-2.3-1.6L5 21.2V2.8Z" />
      <path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 20.5v-1.7a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1.7" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 20.5v-1.7a4 4 0 0 0-3-3.9M16.5 3.2a4 4 0 0 1 0 7.6" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8.2V6a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6v2.2a3.4 3.4 0 0 0 0 6.8V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-3a3.4 3.4 0 0 0 0-6.8Z" />
      <path d="M13 4.8v2M13 10.2v2M13 15.6v2" />
    </>
  ),
  truck: (
    <>
      <path d="M2.8 5.5h11v11h-11zM13.8 9h4l3.4 3.4v4.1h-7.4" />
      <circle cx="6.6" cy="18.4" r="1.9" />
      <circle cx="17.4" cy="18.4" r="1.9" />
    </>
  ),
  star: (
    <path d="m12 2.9 2.8 5.9 6.4.8-4.7 4.4 1.2 6.3-5.7-3.1-5.7 3.1 1.2-6.3L2.8 9.6l6.4-.8L12 2.9Z" />
  ),
  inbox: (
    <>
      <path d="M21.2 12.5h-5.1l-1.7 2.7H9.6l-1.7-2.7H2.8" />
      <path d="M5.5 4.2h13l2.7 8.3v6a2 2 0 0 1-2 2H4.8a2 2 0 0 1-2-2v-6l2.7-8.3Z" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="18" r="2" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  menu: <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  arrowLeft: <path d="M20 12H4M10 6l-6 6 6 6" />,
  arrowRight: <path d="M4 12h16M14 6l6 6-6 6" />,
  arrowUp: <path d="M12 20V4M6 10l6-6 6 6" />,
  arrowDown: <path d="M12 4v16M6 14l6 6 6-6" />,
  edit: (
    <>
      <path d="M16.6 3.6a2.1 2.1 0 0 1 3 3L7.2 19l-4.2 1.2L4.2 16 16.6 3.6Z" />
      <path d="m14.5 5.7 3.8 3.8" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6.5h17M9 6.5V4.2h6v2.3M5.8 6.5l1 13.3h10.4l1-13.3" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16.5V3.5M7 8.5l5-5 5 5" />
      <path d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3.5" width="18" height="17" rx="2" />
      <circle cx="8.5" cy="9" r="1.7" />
      <path d="m21 15.5-5-5-9.5 9.5" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  alert: (
    <>
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v5M12 17.2v.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a15 15 0 0 1-2.6 3.3M6.4 6.9A15.7 15.7 0 0 0 2 12s3.6 6 10 6a10 10 0 0 0 4-.8" />
      <path d="M9.8 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  external: (
    <>
      <path d="M14 3.5h6.5V10" />
      <path d="M20.5 3.5 11 13" />
      <path d="M18 13.5v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h5" />
    </>
  ),
  print: (
    <>
      <path d="M6.5 9V3.5h11V9" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M6.5 15.5h11v5h-11z" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 4v6h-6" />
      <path d="M20.2 10a8.3 8.3 0 1 0 .5 4" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8.2V21l-4-2v-5.8L3 5Z" />,
  lock: (
    <>
      <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  phone: (
    <path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 3.2 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z" />
  ),
  mail: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7.5 2.5V8M16.5 2.5V8M3 10h18" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 2.8 1.8 5.4 5.4 1.8-5.4 1.8L12 17.2l-1.8-5.4L4.8 10l5.4-1.8L12 2.8Z" />
      <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 11.5-8 11.5S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.8" />
    </>
  ),
};

export default function Icon({ name, size = 18, strokeWidth = 1.6, filled = false, style, ...rest }) {
  const content = ICONS[name] || ICONS.sparkle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...rest}
    >
      {content}
    </svg>
  );
}
