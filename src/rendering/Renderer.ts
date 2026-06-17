import { LOGICAL_HEIGHT, LOGICAL_WIDTH, PALETTE } from './palette';
import { PixelFont } from './PixelFont';

/**
 * Wraps the Canvas 2D context. Owns: device-pixel-ratio sizing, integer-snapped
 * logical->device scaling, pixel-art crispness (imageSmoothingEnabled = false),
 * and a few primitive draw helpers. SRP: it knows HOW to paint, not WHAT.
 */
export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  readonly font: PixelFont;
  readonly width = LOGICAL_WIDTH;
  readonly height = LOGICAL_HEIGHT;

  private scale = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Renderer: 2D context unavailable');
    this.ctx = ctx;
    this.font = new PixelFont(this);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Fit the canvas to the viewport at an integer pixel scale. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const maxScale = Math.min(
      window.innerWidth / LOGICAL_WIDTH,
      window.innerHeight / LOGICAL_HEIGHT,
    );
    this.scale = Math.max(1, Math.floor(maxScale));

    const cssW = LOGICAL_WIDTH * this.scale;
    const cssH = LOGICAL_HEIGHT * this.scale;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.width = Math.floor(cssW * dpr);
    this.canvas.height = Math.floor(cssH * dpr);

    this.ctx.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  get element(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Convert a pointer event's client coords to logical canvas coords. */
  clientToLogical(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.width;
    const y = ((clientY - rect.top) / rect.height) * this.height;
    return { x, y };
  }

  begin(): CanvasRenderingContext2D {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = PALETTE.ink;
    this.ctx.fillRect(0, 0, this.width, this.height);
    return this.ctx;
  }

  end(): void {
    /* no-op; reserved for post-processing passes */
  }

  fillRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  strokeRect(x: number, y: number, w: number, h: number, color: string, lw = 1): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lw;
    this.ctx.strokeRect(
      Math.round(x) + 0.5,
      Math.round(y) + 0.5,
      Math.round(w) - 1,
      Math.round(h) - 1,
    );
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, lw = 1): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lw;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.round(x1), Math.round(y1));
    this.ctx.lineTo(Math.round(x2), Math.round(y2));
    this.ctx.stroke();
  }

  circle(cx: number, cy: number, r: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(Math.round(cx), Math.round(cy), r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /** Run draw fn translated by (dx,dy); restores transform afterward. */
  translated(dx: number, dy: number, fn: () => void): void {
    this.ctx.save();
    this.ctx.translate(Math.round(dx), Math.round(dy));
    fn();
    this.ctx.restore();
  }

  withAlpha(alpha: number, fn: () => void): void {
    const prev = this.ctx.globalAlpha;
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    fn();
    this.ctx.globalAlpha = prev;
  }
}
