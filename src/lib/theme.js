/**
 * Golden Aura design tokens.
 * Everything is plain JS so styles can stay inline inside component files.
 */
export const colors = {
  bg: '#FBF8F3',
  bgAlt: '#F6F0E6',
  surface: '#FFFFFF',
  cream: '#F4ECDF',
  sand: '#EDE3D3',
  border: '#E7DAC6',
  borderStrong: '#D5C2A3',
  ink: '#241A12',
  inkSoft: '#493A2C',
  muted: '#8B7A67',
  faint: '#B3A390',
  gold: '#B8873A',
  goldDeep: '#8C6325',
  goldLight: '#D4A84B',
  champagne: '#F8ECD5',
  success: '#3F6B4F',
  successBg: '#EAF1EA',
  danger: '#A6482F',
  dangerBg: '#F8EAE5',
  warning: '#A9791C',
  warningBg: '#FBF0D9',
  info: '#3F5E76',
  infoBg: '#EAF0F4',
  sidebar: '#1C1510',
  sidebarAlt: '#251C15',
  sidebarLine: '#3A2C21',
  sidebarText: '#EDE4D6',
  sidebarMuted: '#A59683',
};

export const fonts = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'Jost', Arial, sans-serif",
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const shadows = {
  card: '0 1px 2px rgba(36, 26, 18, 0.04), 0 10px 30px rgba(36, 26, 18, 0.05)',
  raised: '0 18px 50px rgba(28, 21, 16, 0.16)',
  gold: '0 8px 20px rgba(184, 135, 58, 0.22)',
};

export const layout = {
  sidebarWidth: 256,
  topbarHeight: 72,
  contentMax: 1340,
};

export const fieldBase = {
  width: '100%',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: colors.border,
  borderRadius: radii.md,
  background: colors.surface,
  color: colors.ink,
  fontFamily: fonts.body,
  fontSize: 14,
  fontWeight: 400,
  padding: '11px 13px',
  outline: 'none',
  transition: 'border-color .16s ease, box-shadow .16s ease',
};

export const focusRing = {
  borderColor: colors.gold,
  boxShadow: '0 0 0 3px rgba(184, 135, 58, 0.14)',
};
