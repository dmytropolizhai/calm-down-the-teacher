/**
 * Single source of truth for the warm palette and logical canvas size.
 * (DRY: every render helper imports colors from here, never inlines hex.)
 */

export const PALETTE = {
  cream: '#FFF3E0',
  amber: '#FFB74D',
  terracotta: '#E64A19',
  chalkboard: '#2E7D32',
  wood: '#5D4037',
  shadow: '#3E2723',
  ink: '#1a120b',
  paper: '#fff8ee',
  rageLow: '#FFB74D',
  rageHigh: '#E64A19',
} as const;

/** Logical (pre-scale) resolution. Renderer scales this up to the device. */
export const LOGICAL_WIDTH = 480;
export const LOGICAL_HEIGHT = 270;
