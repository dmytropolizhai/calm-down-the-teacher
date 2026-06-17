import { EventBus } from '../core/EventBus';
import { clampRage, initialState, type GamePhase, type GameState } from './GameState';

/**
 * Holds the current immutable GameState and produces a NEW snapshot on every
 * action (never mutates in place). Emits typed events through the EventBus so
 * the HUD / Teacher / scenes can react without touching the store internals.
 *
 * The action methods are the only way state changes — pure reducers live here.
 */

interface Tuning {
  readonly rageDecayPerHit: number;
  readonly rageIncreasePerMiss: number;
  readonly maxMisses: number;
}

export class StateStore {
  private state: GameState;

  constructor(
    private readonly bus: EventBus,
    private readonly tuning: Tuning,
    startRage: number,
  ) {
    this.state = initialState(startRage);
  }

  get(): GameState {
    return this.state;
  }

  private commit(next: GameState): void {
    this.state = Object.freeze(next);
  }

  setPhase(phase: GamePhase): void {
    if (phase === this.state.phase) return;
    this.commit({ ...this.state, phase });
    this.bus.emit({ type: 'SCENE_CHANGE', to: phase });
  }

  /** Successful note hit: rage drops, score climbs. May trigger victory. */
  registerHit(key: string): void {
    const rage = clampRage(this.state.rage - this.tuning.rageDecayPerHit);
    const score = this.state.score + 100;
    this.commit({ ...this.state, rage, score });
    this.bus.emit({ type: 'NOTE_HIT', key, score });
    this.bus.emit({ type: 'RAGE_CHANGED', rage });
    if (rage <= 0 && this.state.phase === 'gameplay') {
      this.commit({ ...this.state, phase: 'victory' });
      this.bus.emit({ type: 'VICTORY' });
    }
  }

  /** Missed note: rage climbs, miss counter ticks. May trigger defeat. */
  registerMiss(key: string): void {
    const rage = clampRage(this.state.rage + this.tuning.rageIncreasePerMiss);
    const misses = this.state.misses + 1;
    this.commit({ ...this.state, rage, misses });
    this.bus.emit({ type: 'NOTE_MISSED', key, missCount: misses });
    this.bus.emit({ type: 'RAGE_CHANGED', rage });
    const dead = misses >= this.tuning.maxMisses || rage >= 100;
    if (dead && this.state.phase === 'gameplay') {
      this.commit({ ...this.state, phase: 'defeat' });
      this.bus.emit({ type: 'DEFEAT' });
    }
  }

  reset(startRage: number): void {
    this.commit(initialState(startRage));
  }
}
