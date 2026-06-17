import type { AudioManager } from '../audio/AudioManager';
import type { EventBus } from '../core/EventBus';
import type { InputManager } from '../input/InputManager';
import type { Renderer } from '../rendering/Renderer';
import type { LevelConfig } from '../state/LevelConfig';
import type { StateStore } from '../state/StateStore';

export type SceneName = 'menu' | 'gameplay' | 'gameover';

/**
 * The bundle of abstractions scenes depend on (DIP). Scenes receive this; they
 * never construct renderers, input, or audio themselves, and they request scene
 * changes through switchTo rather than knowing about each other.
 */
export interface GameContext {
  readonly renderer: Renderer;
  readonly input: InputManager;
  readonly audio: AudioManager;
  readonly bus: EventBus;
  readonly store: StateStore;
  readonly level: LevelConfig;
  switchTo(scene: SceneName): void;
}
