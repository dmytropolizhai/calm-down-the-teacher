import { Player } from '../entities/Player';
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
}

/**
 * Title screen: classroom backdrop, student centre, teacher idling at the right.
 * START (click or Enter) begins the run. SRP: presentation + start intent; it
 * does not know what the gameplay scene contains, only its SceneName.
 */
export class MainMenuScene implements IScene {
  private readonly teacher: Teacher;
  private readonly student: Player;
  private readonly startBtn: Button;
  private hovered = false;
  private glow = 0;
  private disposers: Array<() => void> = [];

  constructor(private readonly ctx: GameContext) {
    const r = ctx.renderer;
    this.teacher = new Teacher(r.width - 70, r.height - 110);
    this.student = new Player(r.width / 2 - 20, r.height - 70);
    this.startBtn = { x: r.width / 2 - 50, y: r.height - 56, w: 100, h: 26 };
  }

  enter(): void {
    this.ctx.store.reset(this.ctx.level.initialRage);
    this.ctx.store.setPhase('menu');

    const el = this.ctx.renderer.element;
    const onClick = (e: MouseEvent) => {
      const p = this.ctx.renderer.clientToLogical(e.clientX, e.clientY);
      if (this.inButton(p.x, p.y)) this.start();
    };
    const onMove = (e: MouseEvent) => {
      const p = this.ctx.renderer.clientToLogical(e.clientX, e.clientY);
      this.hovered = this.inButton(p.x, p.y);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const p = this.ctx.renderer.clientToLogical(t.clientX, t.clientY);
      if (this.inButton(p.x, p.y)) this.start();
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

  private inButton(x: number, y: number): boolean {
    const b = this.startBtn;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  private start(): void {
    this.ctx.audio.resume(); // user gesture: unlock + warm up audio
    this.ctx.audio.play(Sound.CLICK);
    this.ctx.switchTo('gameplay');
  }

  update(dt: number): void {
    this.teacher.update(dt);
    this.student.update(dt);
    this.glow += dt;
    if (this.ctx.input.consume('enter')) this.start();
  }

  render(): void {
    const r = this.ctx.renderer;
    ProceduralSprites.drawClassroom(r.ctx, r.width, r.height);
    this.student.render(r);
    this.teacher.render(r);

    // title
    r.font.draw('CALM DOWN', r.width / 2, 14, 3, PALETTE.shadow, 'center');
    r.font.draw('THE TEACHER', r.width / 2, 40, 3, PALETTE.terracotta, 'center');

    // start button with pulsing amber glow
    const pulse = (Math.sin(this.glow * 4) + 1) / 2;
    r.withAlpha(0.5 + pulse * 0.5, () => {
      ProceduralSprites.drawButton(r, this.startBtn.x, this.startBtn.y, this.startBtn.w, this.startBtn.h, 'START', {
        glow: true,
        hovered: this.hovered,
      });
    });

    r.font.draw('PRESS ENTER OR CLICK START', r.width / 2, r.height - 14, 1, PALETTE.shadow, 'center');
  }
}
