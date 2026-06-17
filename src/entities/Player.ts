import { Animator } from '../rendering/Animator';
import { ProceduralSprites } from '../rendering/ProceduralSprites';
import type { Renderer } from '../rendering/Renderer';

/**
 * The student avatar. Sits at a desk; plays a small reaction bob on hit/miss.
 * SRP: position + reaction animation only.
 */
export class Player {
  private readonly animator = new Animator(4, 3, true);
  private reactTimer = 0;
  private reactKind: 'hit' | 'miss' | null = null;

  constructor(
    public x: number,
    public y: number,
  ) {}

  react(kind: 'hit' | 'miss'): void {
    this.reactTimer = 0.25;
    this.reactKind = kind;
  }

  update(dt: number): void {
    this.animator.update(dt);
    if (this.reactTimer > 0) {
      this.reactTimer = Math.max(0, this.reactTimer - dt);
      if (this.reactTimer === 0) this.reactKind = null;
    }
  }

  render(r: Renderer): void {
    const nudge = this.reactKind === 'hit' ? -1 : this.reactKind === 'miss' ? 1 : 0;
    ProceduralSprites.drawStudent(r.ctx, this.x, this.y + nudge, this.animator.frame);
    // Replace with: spriteSheet.draw(ctx, 'student_sit', this.x, this.y + nudge)
  }
}
