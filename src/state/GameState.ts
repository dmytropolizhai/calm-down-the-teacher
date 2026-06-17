/**
 * Immutable scalar snapshot of the run.
 *
 * DEVIATION FROM SPEC (deliberate): the original spec put `activeNotes` inside
 * GameState and called the whole thing "immutable". Falling notes mutate their
 * `y` every frame, so keeping them in an immutable snapshot would force a full
 * array re-allocation 60x/second for zero benefit. Notes therefore live in the
 * entity layer (GameplayScene owns the array); the store owns only the values
 * that genuinely benefit from immutable, event-driven updates.
 */

export type GamePhase = 'menu' | 'transitioning' | 'gameplay' | 'victory' | 'defeat';

export interface GameState {
  readonly rage: number; // 0-100; 0 = calm/victory, 100 = defeat
  readonly score: number;
  readonly misses: number; // 0..maxMisses; at max = defeat
  readonly phase: GamePhase;
}

export function initialState(initialRage: number): GameState {
  return Object.freeze({
    rage: clampRage(initialRage),
    score: 0,
    misses: 0,
    phase: 'menu',
  });
}

export function clampRage(rage: number): number {
  return Math.max(0, Math.min(100, rage));
}
