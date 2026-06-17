import { PALETTE } from '../rendering/palette';
import type { Renderer } from '../rendering/Renderer';

/**
 * Renders rage meter, score and remaining-miss icons onto the canvas. SRP: it
 * draws the readout and smooths the rage bar; it does not own the numbers.
 */
export class HUD {
  private displayedRage: number;

  constructor(initialRage: number, private readonly maxMisses: number) {
    this.displayedRage = initialRage;
  }

  /** Lerp the bar toward the real rage value (rate ~3/sec of the gap). */
  update(dt: number, targetRage: number): void {
    this.displayedRage += (targetRage - this.displayedRage) * Math.min(1, dt * 3);
    if (Math.abs(targetRage - this.displayedRage) < 0.2) this.displayedRage = targetRage;
  }

  render(r: Renderer, score: number, misses: number): void {
    // ---- rage meter (top, centred) ----
    const barW = 200;
    const barH = 10;
    const barX = Math.round(r.width / 2 - barW / 2);
    const barY = 6;
    r.font.draw('RAGE', barX - 4, barY + 1, 1, PALETTE.shadow, 'right');
    r.fillRect(barX - 1, barY - 1, barW + 2, barH + 2, PALETTE.shadow);
    r.fillRect(barX, barY, barW, barH, '#e8d4b0');
    const fill = Math.round((this.displayedRage / 100) * barW);
    // amber -> terracotta gradient by interpolating fill color
    for (let i = 0; i < fill; i++) {
      const t = i / barW;
      r.ctx.fillStyle = t < 0.5 ? PALETTE.rageLow : PALETTE.rageHigh;
      r.ctx.fillRect(barX + i, barY, 1, barH);
    }
    // tick at 0 (victory edge)
    r.fillRect(barX, barY - 2, 1, barH + 4, PALETTE.chalkboard);

    // ---- score (top-left) ----
    r.font.draw('SCORE', 6, 6, 1, PALETTE.shadow, 'left');
    r.font.draw(String(score).padStart(5, '0'), 6, 16, 1, PALETTE.terracotta, 'left');

    // ---- miss icons (top-right): little erasers, remaining shown filled ----
    const remaining = Math.max(0, this.maxMisses - misses);
    r.font.draw('MISSES', r.width - 6, 6, 1, PALETTE.shadow, 'right');
    const iconW = 8;
    const iconH = 5;
    const perRow = 5;
    for (let i = 0; i < this.maxMisses; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const ix = r.width - 6 - (perRow - col) * (iconW + 2);
      const iy = 16 + row * (iconH + 2);
      const used = i >= remaining;
      r.fillRect(ix, iy, iconW, iconH, PALETTE.shadow);
      r.fillRect(ix + 1, iy + 1, iconW - 2, iconH - 2, used ? '#7a6a55' : '#f06292');
      if (!used) r.fillRect(ix + 1, iy + 1, iconW - 2, 1, '#ffd0e0');
    }
  }
}
