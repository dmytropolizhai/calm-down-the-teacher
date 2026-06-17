import { Teacher } from '../entities/Teacher';
import { ProceduralSprites } from '../rendering/ProceduralSprites';
import { PALETTE } from '../rendering/palette';
import { Sound } from '../audio/sounds';
import type { GameContext } from './GameContext';
import type { IScene } from './IScene';

interface Button {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  action: () => void;
}

const LATVIAN = 'Ar pierakstiem pie skolotāja!';

/**
 * End screen for both outcomes (mode chosen from store.phase at enter()):
 *  - defeat  : dark overlay, FURIOUS teacher, the Latvian summons, GAME OVER.
 *  - victory : warm overlay, CALM waving teacher, TEACHER CALMED.
 * SRP: outcome presentation + replay/menu intents only.
 */
export class GameOverScene implements IScene {
  private readonly teacher: Teacher;
  private victory = false;
  private buttons: Button[] = [];
  private hovered = -1;
  private t = 0;
  private disposers: Array<() => void> = [];

  constructor(private readonly ctx: GameContext) {
    this.teacher = new Teacher(ctx.renderer.width / 2 - 18, ctx.renderer.height / 2 - 20);
  }

  enter(): void {
    const s = this.ctx.store.get();
    this.victory = s.phase === 'victory';
    this.teacher.syncToRage(this.victory ? 0 : 100);

    const r = this.ctx.renderer;
    const bw = 110;
    const bh = 24;
    const by = r.height - 40;
    this.buttons = [
      {
        x: r.width / 2 - bw - 6,
        y: by,
        w: bw,
        h: bh,
        label: this.victory ? 'PLAY AGAIN' : 'TRY AGAIN',
        action: () => {
          this.ctx.audio.play(Sound.CLICK);
          this.ctx.switchTo('gameplay');
        },
      },
      {
        x: r.width / 2 + 6,
        y: by,
        w: bw,
        h: bh,
        label: 'MAIN MENU',
        action: () => {
          this.ctx.audio.play(Sound.CLICK);
          this.ctx.switchTo('menu');
        },
      },
    ];

    const el = r.element;
    const onClick = (e: MouseEvent) => {
      const p = r.clientToLogical(e.clientX, e.clientY);
      const b = this.buttons.find((btn) => this.inBtn(btn, p.x, p.y));
      b?.action();
    };
    const onMove = (e: MouseEvent) => {
      const p = r.clientToLogical(e.clientX, e.clientY);
      this.hovered = this.buttons.findIndex((btn) => this.inBtn(btn, p.x, p.y));
    };
    const onTouch = (e: TouchEvent) => {
      const tch = e.changedTouches[0];
      if (!tch) return;
      const p = r.clientToLogical(tch.clientX, tch.clientY);
      this.buttons.find((btn) => this.inBtn(btn, p.x, p.y))?.action();
    };
    el.addEventListener('click', onClick);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('touchend', onTouch);
    this.disposers.push(() => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('touchend', onTouch);
    });
  }

  exit(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
  }

  private inBtn(b: Button, x: number, y: number): boolean {
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  update(dt: number): void {
    this.t += dt;
    this.teacher.update(dt, { waving: this.victory });
    if (this.ctx.input.consume('enter')) this.buttons[0]?.action();
  }

  render(): void {
    const r = this.ctx.renderer;
    ProceduralSprites.drawClassroom(r.ctx, r.width, r.height, !this.victory);

    // outcome overlay
    r.withAlpha(this.victory ? 0.18 : 0.55, () => {
      r.fillRect(0, 0, r.width, r.height, this.victory ? PALETTE.amber : '#0a0604');
    });

    this.teacher.render(r, { waving: this.victory });

    const title = this.victory ? 'TEACHER CALMED!' : 'GAME OVER';
    const titleColor = this.victory ? PALETTE.chalkboard : PALETTE.terracotta;
    r.font.draw(title, r.width / 2, 34, 3, titleColor, 'center');

    if (!this.victory) {
      // the Latvian summons, styled prominently
      r.fillRect(r.width / 2 - r.font.measure(LATVIAN, 1) / 2 - 6, 66, r.font.measure(LATVIAN, 1) + 12, 14, PALETTE.shadow);
      r.font.draw(LATVIAN, r.width / 2, 69, 1, PALETTE.amber, 'center');
    } else {
      r.font.draw('NICE WORK, STAY OUT OF TROUBLE', r.width / 2, 70, 1, PALETTE.shadow, 'center');
    }

    const score = this.ctx.store.get().score;
    r.font.draw('FINAL SCORE', r.width / 2, r.height - 78, 1, PALETTE.cream, 'center');
    r.font.draw(String(score).padStart(5, '0'), r.width / 2, r.height - 68, 2, PALETTE.amber, 'center');

    this.buttons.forEach((b, i) => {
      ProceduralSprites.drawButton(r, b.x, b.y, b.w, b.h, b.label, { glow: i === 0, hovered: this.hovered === i });
    });
  }
}
