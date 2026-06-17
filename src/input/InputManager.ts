/**
 * Keyboard input with per-frame edge detection. SRP: it only tracks key state;
 * it does not interpret keys as game actions.
 *
 * - isDown(key): held this instant
 * - consume(key): true exactly once per physical press (then cleared)
 * - justPressed(): all keys pressed since the last flush()
 * - flush(): GameLoop calls this at end of frame to clear the edge set
 */
export class InputManager {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();
  private disposed = false;

  constructor(target: Window = window) {
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    this.dispose = () => {
      if (this.disposed) return;
      this.disposed = true;
      target.removeEventListener('keydown', this.onKeyDown);
      target.removeEventListener('keyup', this.onKeyUp);
    };
  }

  dispose: () => void = () => {};

  private normalize(e: KeyboardEvent): string {
    if (e.key === ' ' || e.code === 'Space') return 'space';
    return e.key.toLowerCase();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const k = this.normalize(e);
    if (k === 'space' || k === 'enter') e.preventDefault();
    if (!e.repeat && !this.down.has(k)) this.pressed.add(k);
    this.down.add(k);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(this.normalize(e));
  };

  /** Inject a synthetic press (used by TouchAdapter for on-screen buttons). */
  injectPress(key: string): void {
    this.pressed.add(key.toLowerCase());
  }

  isDown(key: string): boolean {
    return this.down.has(key.toLowerCase());
  }

  consume(key: string): boolean {
    const k = key.toLowerCase();
    if (this.pressed.has(k)) {
      this.pressed.delete(k);
      return true;
    }
    return false;
  }

  justPressed(): string[] {
    return [...this.pressed];
  }

  flush(): void {
    this.pressed.clear();
  }
}
