import { StateMachine, type StateNode } from '../core/StateMachine';
import { Animator } from '../rendering/Animator';
import { ProceduralSprites, type TeacherVisualState } from '../rendering/ProceduralSprites';
import { PALETTE } from '../rendering/palette';
import type { Renderer } from '../rendering/Renderer';
import { SpeechBubble } from '../ui/SpeechBubble';

export type RageState = 'CALM' | 'ANNOYED' | 'FURIOUS';

const TEACHER_W = 36;
const TEACHER_H = 64;

/**
 * Teacher entity: owns its rage FSM, idle animation, miss-shake, optional
 * walk-in tween, and its speech bubble. SRP boundary: it reacts to rage values
 * handed to it; it does not compute rage or decide game outcomes.
 */
export class Teacher {
  private readonly fsm: StateMachine<RageState>;
  private readonly animator = new Animator(2, 2, true);
  private readonly bubble = new SpeechBubble(2, 0.3);

  private shakeTimer = 0;
  private shakeX = 0;
  private wave = 0; // victory waving phase

  /** Box top-left position; tween targets move this. */
  x: number;
  y: number;
  private targetX: number;
  walking = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;

    const node = (name: RageState, transitions: RageState[]): StateNode<RageState> => ({
      name,
      transitions,
    });
    this.fsm = new StateMachine<RageState>(
      [
        node('CALM', ['ANNOYED', 'FURIOUS']),
        node('ANNOYED', ['CALM', 'FURIOUS']),
        node('FURIOUS', ['ANNOYED', 'CALM']),
      ],
      'CALM',
    );
  }

  get state(): RageState {
    return this.fsm.state;
  }

  /** Map a rage value (0-100) onto the visual state machine. */
  syncToRage(rage: number): void {
    const next: RageState = rage >= 67 ? 'FURIOUS' : rage >= 34 ? 'ANNOYED' : 'CALM';
    if (next !== this.fsm.state) {
      this.fsm.set(next);
      // faster idle gestures as mood worsens
      const fps = next === 'FURIOUS' ? 6 : next === 'ANNOYED' ? 4 : 2;
      this.animator.reset(2, fps);
    }
  }

  /** Trigger the miss reaction: horizontal shake + a spoken phrase. */
  react(phrase: string): void {
    this.shakeTimer = 0.2;
    this.bubble.say(phrase);
  }

  say(phrase: string): void {
    this.bubble.say(phrase);
  }

  /** Begin a lerp walk from current x to targetX over the loop. */
  walkTo(targetX: number): void {
    this.targetX = targetX;
    this.walking = true;
    this.animator.reset(2, 6);
  }

  get walkProgressDone(): boolean {
    return Math.abs(this.x - this.targetX) < 0.5;
  }

  update(dt: number, opts: { waving?: boolean } = {}): void {
    this.animator.update(dt);
    this.bubble.update(dt);

    if (this.walking) {
      this.x += (this.targetX - this.x) * Math.min(1, dt * 4);
      if (this.walkProgressDone) {
        this.x = this.targetX;
        this.walking = false;
        this.animator.reset(2, 2);
      }
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      this.shakeX = (Math.random() * 2 - 1) * 4;
    } else {
      this.shakeX = 0;
    }

    if (opts.waving) this.wave += dt * 6;
  }

  render(r: Renderer, opts: { waving?: boolean } = {}): void {
    const visual: TeacherVisualState =
      this.state === 'FURIOUS' ? 'furious' : this.state === 'ANNOYED' ? 'annoyed' : 'calm';
    const drawX = this.x + this.shakeX + (opts.waving ? Math.sin(this.wave) * 2 : 0);

    ProceduralSprites.drawTeacher(r.ctx, drawX, this.y, visual, this.animator.frame);
    // Replace with: spriteSheet.draw(ctx, `teacher_${visual}`, drawX, this.y)

    // FURIOUS red tint overlay
    if (this.state === 'FURIOUS') {
      r.withAlpha(0.22, () => {
        r.fillRect(drawX, this.y, TEACHER_W, TEACHER_H, PALETTE.terracotta);
      });
    }
  }

  renderBubble(r: Renderer): void {
    this.bubble.render(r, this.x + TEACHER_W / 2, this.y);
  }

  get centerX(): number {
    return this.x + TEACHER_W / 2;
  }
}
