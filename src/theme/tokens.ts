export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const fontSize = {
  xs: 10,
  sm: 11,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 24,
} as const;

export const colors = {
  bg: '#000000',
  panel: '#1a1a1a',
  panelAlt: '#2a2a2a',
  border: '#444',
  text: '#fff',
  textMuted: '#aaa',
} as const;

/** Command-terminal aesthetic: green-on-dark. Use for screens that match the titan edit "terminal" look. */
export const terminal = {
  /** Dark green-black panel/card background */
  panelBg: '#0d120e',
  /** Primary heading/label (bright green) */
  textPrimary: '#9dffb2',
  /** Same as textPrimary, alternate hex (e.g. #9AFCAF) */
  textPrimaryAlt: '#9AFCAF',
  /** Secondary text (teal-green) */
  textSecondary: '#8be39d',
  /** Inactive/slot fill (dark green) */
  inactiveFill: '#1e3524',
  /** Section border / accent line */
  border: '#00A323',
  /** Subtle green tint for highlighted rows (e.g. reactor/shield row) */
  rowTint: 'rgba(0, 152, 33, 0.15)',
} as const;

export const layout = {
  labelMinWidth: 150,
  // Shared pip sizing for REACTOR / color row / SHIELDS alignment
  pipTouchSize: 24,
  // Space reserved per pip "slot".
  // Keep this relatively tight so 7–8 pips can fit on one line on modern phones.
  pipSlotWidth: 32,
  // Gap between pip "slots" (separate from the slot width)
  pipSlotGap: 4,
} as const;


