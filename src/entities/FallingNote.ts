import { ProceduralSprites } from '../rendering/ProceduralSprites';
import { PALETTE } from '../rendering/palette';
import type { Renderer } from '../rendering/Renderer';

/**
 * A single falling key tile. SRP: tracks its own position/state and draws
 * itself. It does NOT decide spawning (NoteSpawner) or scoring (HitDetector).
 */
export const NOTE_SIZE = 26;

const COLUMN_ACCENT = ['#E64A19', '#FB8C00', '#FFB300', '#43A047', '#1E88E5', '#5E35B1', '#D81B60'];

export class FallingNote {
  y: number;
  hit = false;
  missed = false;

  constructor(
    readonly column: number, // 0-6
    readonly key: string, // 'a' | 's' | ... | 'l'
    readonly x: number, // centre-x of the column in logical px
    readonly speed: number, // px per second
    startY = -NOTE_SIZE,
  ) {
    this.y = startY;
  }

  update(dt: number): void {
    if (this.hit || this.missed) return;
    this.y += this.speed * dt;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + NOTE_SIZE;
  }

  render(r: Renderer): void {
    if (this.hit) return;
    const left = this.x - NOTE_SIZE / 2;
    const accent = COLUMN_ACCENT[this.column] ?? PALETTE.terracotta;
    ProceduralSprites.drawNoteTile(r.ctx, left, this.y, NOTE_SIZE, accent);
    // Replace tile body with: spriteSheet.draw(ctx, 'note_tile', left, this.y)
    r.font.draw(this.key, this.x, this.y + NOTE_SIZE / 2 - 3, 2, PALETTE.shadow, 'center');
  }
}
