import type { IScene } from './IScene';
import type { SceneName } from './GameContext';

/**
 * Holds the current scene and runs the enter/exit lifecycle. SRP: it knows only
 * how to swap scenes; it has no idea what any scene does. Scenes are built fresh
 * on each switch via their registered factory, so re-entering a scene resets it.
 */
export class SceneManager {
  private current: IScene | null = null;
  private readonly factories = new Map<SceneName, () => IScene>();

  register(name: SceneName, factory: () => IScene): void {
    this.factories.set(name, factory);
  }

  switchTo(name: SceneName): void {
    const factory = this.factories.get(name);
    if (!factory) throw new Error(`SceneManager: no scene registered as "${name}"`);
    this.current?.exit();
    this.current = factory();
    this.current.enter();
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.current?.render(ctx);
  }
}
