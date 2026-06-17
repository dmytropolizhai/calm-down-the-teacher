/**
 * Slices a loaded image into named frames. Currently unused by the procedural
 * build (no PNGs ship), but kept as the documented seam for real assets:
 *
 *   const sheet = await SpriteSheet.load('teacher.png', 32, 32);
 *   sheet.draw(ctx, 'teacher_calm', x, y);
 *
 * SRP: knows only how to map a name/index to a source rect and blit it.
 */

export interface FrameRect {
  readonly sx: number;
  readonly sy: number;
  readonly sw: number;
  readonly sh: number;
}

export class SpriteSheet {
  private readonly named = new Map<string, FrameRect>();

  private constructor(
    private readonly image: HTMLImageElement,
    private readonly frameW: number,
    private readonly frameH: number,
  ) {}

  static load(src: string, frameW: number, frameH: number): Promise<SpriteSheet> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(new SpriteSheet(img, frameW, frameH));
      img.onerror = () => reject(new Error(`SpriteSheet: failed to load ${src}`));
      img.src = src;
    });
  }

  /** Register a name for a (row, col) frame so callers can draw by name. */
  define(name: string, col: number, row: number): this {
    this.named.set(name, {
      sx: col * this.frameW,
      sy: row * this.frameH,
      sw: this.frameW,
      sh: this.frameH,
    });
    return this;
  }

  drawFrame(
    ctx: CanvasRenderingContext2D,
    col: number,
    row: number,
    dx: number,
    dy: number,
    scale = 1,
  ): void {
    ctx.drawImage(
      this.image,
      col * this.frameW,
      row * this.frameH,
      this.frameW,
      this.frameH,
      Math.round(dx),
      Math.round(dy),
      this.frameW * scale,
      this.frameH * scale,
    );
  }

  draw(ctx: CanvasRenderingContext2D, name: string, dx: number, dy: number, scale = 1): void {
    const f = this.named.get(name);
    if (!f) return;
    ctx.drawImage(
      this.image,
      f.sx,
      f.sy,
      f.sw,
      f.sh,
      Math.round(dx),
      Math.round(dy),
      f.sw * scale,
      f.sh * scale,
    );
  }
}
