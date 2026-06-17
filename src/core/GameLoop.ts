import type { SceneManager } from '../scenes/SceneManager';
import type { Renderer } from '../rendering/Renderer';
import type { InputManager } from '../input/InputManager';

/**
 * requestAnimationFrame driver. Owns the update/render cadence and nothing
 * else (SRP). DIP: depends on SceneManager / Renderer / InputManager as
 * collaborators passed in, never constructs them.
 */
export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private running = false;

  constructor(
    private readonly scenes: SceneManager,
    private readonly renderer: Renderer,
    private readonly input: InputManager,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    // Clamp dt so an alt-tab pause doesn't teleport every note off-screen.
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 20);
    this.lastTime = now;

    this.scenes.update(dt);

    const ctx = this.renderer.begin();
    this.scenes.render(ctx);
    this.renderer.end();

    // Clear per-frame "just pressed" edge state after everyone has read it.
    this.input.flush();

    this.rafId = requestAnimationFrame(this.frame);
  };
}
