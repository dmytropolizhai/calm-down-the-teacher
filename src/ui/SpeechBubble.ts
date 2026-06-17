import { PALETTE } from '../rendering/palette';
import type { Renderer } from '../rendering/Renderer';

/**
 * Pixel-art speech bubble with text and a show/fade lifecycle.
 * SRP: timing + drawing of one bubble; it does not pick the phrases.
 *
 * Lifecycle: say() -> visible for holdSec -> fade over fadeSec -> hidden.
 */
export class SpeechBubble {
  private text = '';
  private timer = 0;
  private readonly holdSec: number;
  private readonly fadeSec: number;

  constructor(holdSec = 2, fadeSec = 0.3) {
    this.holdSec = holdSec;
    this.fadeSec = fadeSec;
  }

  say(text: string): void {
    this.text = text;
    this.timer = this.holdSec + this.fadeSec;
  }

  get visible(): boolean {
    return this.timer > 0;
  }

  update(dt: number): void {
    if (this.timer > 0) this.timer = Math.max(0, this.timer - dt);
  }

  private alpha(): number {
    if (this.timer <= 0) return 0;
    if (this.timer >= this.fadeSec) return 1;
    return this.timer / this.fadeSec;
  }

  /** Draw the bubble with its tail pointing down toward (anchorX, anchorY). */
  render(r: Renderer, anchorX: number, anchorY: number): void {
    if (this.timer <= 0) return;
    const scale = 1;
    const padX = 6;
    const padY = 5;
    const textW = r.font.measure(this.text, scale);
    const w = Math.min(textW + padX * 2, r.width - 8);
    const h = 7 * scale + padY * 2;
    let x = Math.round(anchorX - w / 2);
    x = Math.max(4, Math.min(x, r.width - w - 4));
    const y = Math.round(anchorY - h - 8);

    r.withAlpha(this.alpha(), () => {
      // shadow + body + border
      r.fillRect(x + 2, y + 2, w, h, 'rgba(0,0,0,0.25)');
      r.fillRect(x, y, w, h, PALETTE.paper);
      r.strokeRect(x, y, w, h, PALETTE.shadow, 1);
      // tail
      const tx = Math.max(x + 6, Math.min(anchorX, x + w - 10));
      r.fillRect(tx, y + h, 4, 4, PALETTE.paper);
      r.fillRect(tx, y + h + 4, 2, 3, PALETTE.paper);
      r.line(tx, y + h, tx, y + h + 6, PALETTE.shadow, 1);
      r.line(tx + 4, y + h, tx + 2, y + h + 6, PALETTE.shadow, 1);
      // text (clipped to bubble width by truncation)
      r.font.draw(this.text, x + w / 2, y + padY, scale, PALETTE.shadow, 'center');
    });
  }
}
