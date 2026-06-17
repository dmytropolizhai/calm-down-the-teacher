import { PALETTE } from './palette';
import type { Renderer } from './Renderer';

export type TeacherVisualState = 'calm' | 'annoyed' | 'furious';

/**
 * Draws every character and tile with Canvas 2D primitives so the game is
 * playable with zero image assets. Each method documents where a real
 * SpriteSheet.draw() call would slot in once PNGs exist.
 *
 * All methods are static and stateless (the caller supplies animation `frame`).
 */
export const ProceduralSprites = {
  px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  },

  /**
   * Teacher figure. Bounding box ~36x64; (x,y) is the top-left of that box.
   * Replace with: spriteSheet.draw(ctx, `teacher_${state}`, x, y).
   */
  drawTeacher(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: TeacherVisualState,
    frame: number,
  ): void {
    const p = ProceduralSprites.px;
    const bob = frame % 2 === 0 ? 0 : 1; // gentle idle bob
    const oy = y + bob;

    const skin = '#f0c8a0';
    const hair = '#4a342a';
    const dress =
      state === 'furious' ? '#b03010' : state === 'annoyed' ? '#d4622a' : PALETTE.terracotta;
    const dressShade = state === 'furious' ? '#7a1d08' : '#a8350f';

    // legs
    p(ctx, x + 11, oy + 50, 5, 14, PALETTE.shadow);
    p(ctx, x + 20, oy + 50, 5, 14, PALETTE.shadow);
    // shoes
    p(ctx, x + 9, oy + 62, 8, 3, '#2a1a12');
    p(ctx, x + 19, oy + 62, 8, 3, '#2a1a12');

    // body / dress
    p(ctx, x + 8, oy + 26, 20, 26, dress);
    p(ctx, x + 8, oy + 26, 3, 26, dressShade);
    p(ctx, x + 12, oy + 30, 12, 2, dressShade); // collar trim

    // arms — pose changes with mood
    if (state === 'calm') {
      p(ctx, x + 4, oy + 28, 4, 18, dress); // arms down
      p(ctx, x + 28, oy + 28, 4, 18, dress);
      p(ctx, x + 4, oy + 44, 4, 4, skin);
      p(ctx, x + 28, oy + 44, 4, 4, skin);
    } else if (state === 'annoyed') {
      p(ctx, x + 4, oy + 28, 4, 12, dress); // one hand on hip
      p(ctx, x + 2, oy + 38, 6, 4, skin);
      p(ctx, x + 28, oy + 28, 4, 16, dress);
      p(ctx, x + 28, oy + 42, 4, 4, skin);
    } else {
      p(ctx, x + 2, oy + 22, 5, 8, dress); // both arms raised
      p(ctx, x + 1, oy + 18, 5, 5, skin);
      p(ctx, x + 29, oy + 22, 5, 8, dress);
      p(ctx, x + 30, oy + 18, 5, 5, skin);
    }

    // head
    p(ctx, x + 10, oy + 8, 16, 18, skin);
    // hair
    p(ctx, x + 9, oy + 4, 18, 7, hair);
    p(ctx, x + 9, oy + 8, 3, 10, hair);
    p(ctx, x + 24, oy + 8, 3, 10, hair);

    // glasses + eyes
    const blink = frame % 6 === 5 && state === 'calm';
    const eyeY = oy + 14;
    p(ctx, x + 12, eyeY - 1, 5, 5, '#ffffff');
    p(ctx, x + 19, eyeY - 1, 5, 5, '#ffffff');
    if (!blink) {
      const pupil = state === 'furious' ? PALETTE.terracotta : '#2a1a12';
      const px2 = state === 'annoyed' || state === 'furious' ? 1 : 0;
      p(ctx, x + 13 + px2, eyeY, 2, 2, pupil);
      p(ctx, x + 20 + px2, eyeY, 2, 2, pupil);
    } else {
      p(ctx, x + 12, eyeY + 1, 5, 1, '#2a1a12');
      p(ctx, x + 19, eyeY + 1, 5, 1, '#2a1a12');
    }
    // glasses frame
    p(ctx, x + 11, eyeY - 2, 7, 1, '#2a1a12');
    p(ctx, x + 18, eyeY - 2, 7, 1, '#2a1a12');

    // brows
    if (state === 'annoyed') {
      p(ctx, x + 12, eyeY - 3, 5, 1, hair);
      p(ctx, x + 19, eyeY - 3, 5, 1, hair);
    } else if (state === 'furious') {
      p(ctx, x + 12, eyeY - 4, 5, 1, hair);
      p(ctx, x + 13, eyeY - 3, 4, 1, hair);
      p(ctx, x + 19, eyeY - 4, 5, 1, hair);
      p(ctx, x + 19, eyeY - 3, 4, 1, hair);
    }

    // mouth
    if (state === 'calm') {
      p(ctx, x + 15, oy + 21, 6, 1, '#8a4a3a'); // neutral/slight smile
      p(ctx, x + 14, oy + 20, 1, 1, '#8a4a3a');
      p(ctx, x + 21, oy + 20, 1, 1, '#8a4a3a');
    } else if (state === 'annoyed') {
      p(ctx, x + 15, oy + 22, 6, 1, '#8a4a3a'); // flat frown
    } else {
      p(ctx, x + 15, oy + 21, 6, 3, '#5a1a10'); // open shout
      p(ctx, x + 16, oy + 22, 4, 1, '#c03020');
    }
  },

  /**
   * Student at a desk. (x,y) top-left of the desk area; figure sits behind it.
   * Replace with: spriteSheet.draw(ctx, 'student_sit', x, y).
   */
  drawStudent(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
    const p = ProceduralSprites.px;
    const skin = '#e8b890';
    const hair = '#2a1a10';
    const shirt = '#4a7ab0';
    const bob = frame % 4 < 2 ? 0 : 1;

    // body behind desk
    p(ctx, x + 10, y + 2 + bob, 20, 16, shirt);
    // head
    p(ctx, x + 13, y - 12 + bob, 14, 15, skin);
    p(ctx, x + 12, y - 15 + bob, 16, 6, hair);
    p(ctx, x + 12, y - 12 + bob, 2, 8, hair);
    p(ctx, x + 26, y - 12 + bob, 2, 8, hair);
    // eyes (facing teacher)
    p(ctx, x + 16, y - 6 + bob, 2, 2, '#2a1a12');
    p(ctx, x + 22, y - 6 + bob, 2, 2, '#2a1a12');

    // desk
    p(ctx, x, y + 16, 40, 6, PALETTE.wood);
    p(ctx, x, y + 16, 40, 2, '#7a5040');
    p(ctx, x + 4, y + 22, 4, 16, PALETTE.shadow);
    p(ctx, x + 32, y + 22, 4, 16, PALETTE.shadow);
    // paper + pencil
    p(ctx, x + 14, y + 13, 12, 4, PALETTE.paper);
  },

  /**
   * Falling key tile background (letter drawn separately by the caller).
   * Replace with: spriteSheet.draw(ctx, 'note_tile', x, y).
   */
  drawNoteTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    accent: string,
  ): void {
    const p = ProceduralSprites.px;
    p(ctx, x, y, size, size, PALETTE.shadow);
    p(ctx, x + 1, y + 1, size - 2, size - 2, PALETTE.cream);
    p(ctx, x + 1, y + 1, size - 2, 2, accent);
    p(ctx, x + 1, y + size - 3, size - 2, 2, '#d9c4a0');
  },

  /** Classroom backdrop: chalkboard, frame, windows, floor. */
  drawClassroom(ctx: CanvasRenderingContext2D, w: number, h: number, dim = false): void {
    const p = ProceduralSprites.px;
    // wall
    p(ctx, 0, 0, w, h, dim ? '#5a4a30' : '#d8c39a');
    // floor
    p(ctx, 0, h - 40, w, 40, dim ? '#3a2a1a' : PALETTE.wood);
    p(ctx, 0, h - 40, w, 2, '#7a5538');
    // floor boards
    for (let bx = 0; bx < w; bx += 32) {
      p(ctx, bx, h - 40, 1, 40, '#4a3424');
    }

    // chalkboard
    const bx = w / 2 - 90;
    p(ctx, bx - 4, 22, 188, 84, '#6a4a2a'); // wood frame
    p(ctx, bx, 26, 180, 76, dim ? '#1d3d20' : PALETTE.chalkboard);
    if (!dim) {
      // faint chalk scribbles
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(bx + 12, 40, 60, 1);
      ctx.fillRect(bx + 12, 50, 90, 1);
      ctx.fillRect(bx + 12, 60, 40, 1);
      ctx.fillRect(bx + 120, 44, 40, 1);
      ctx.fillRect(bx + 120, 54, 30, 1);
    }
    // chalk tray
    p(ctx, bx - 4, 104, 188, 4, '#5a3a1a');

    // windows with warm afternoon light
    const winColor = dim ? '#3a3a4a' : PALETTE.amber;
    for (const wx of [20, w - 64]) {
      p(ctx, wx, 30, 44, 56, '#6a4a2a');
      p(ctx, wx + 3, 33, 38, 50, winColor);
      p(ctx, wx + 3 + 17, 33, 2, 50, '#6a4a2a');
      p(ctx, wx + 3, 33 + 24, 38, 2, '#6a4a2a');
      if (!dim) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(wx + 5, 35, 8, 46);
      }
    }
  },

  /** Pixel-art button. Returns nothing; caller owns hit-testing. */
  drawButton(
    r: Renderer,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    opts: { glow?: boolean; hovered?: boolean } = {},
  ): void {
    const ctx = r.ctx;
    const p = ProceduralSprites.px;
    if (opts.glow) {
      ctx.save();
      ctx.shadowColor = PALETTE.amber;
      ctx.shadowBlur = opts.hovered ? 18 : 10;
      p(ctx, x, y, w, h, PALETTE.amber);
      ctx.restore();
    }
    const face = opts.hovered ? '#ffcf80' : PALETTE.amber;
    p(ctx, x, y, w, h, PALETTE.shadow);
    p(ctx, x + 2, y + 2, w - 4, h - 4, face);
    p(ctx, x + 2, y + 2, w - 4, 2, '#fff0d8'); // top highlight
    p(ctx, x + 2, y + h - 4, w - 4, 2, '#c47a28'); // bottom shade
    r.font.draw(label, x + w / 2, y + h / 2 - 3, 1, PALETTE.shadow, 'center');
  },
};
