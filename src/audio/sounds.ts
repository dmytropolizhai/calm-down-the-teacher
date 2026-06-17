/** Typed sound asset keys. The single source of truth for sound identifiers. */
export const Sound = {
  HIT: 'HIT',
  MISS: 'MISS',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
  MENU_BGM: 'MENU_BGM',
  CLICK: 'CLICK',
} as const;

export type SoundKey = (typeof Sound)[keyof typeof Sound];
