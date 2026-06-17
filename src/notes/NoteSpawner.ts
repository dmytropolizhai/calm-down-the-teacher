import { FallingNote } from '../entities/FallingNote';
import { columnXs, type LevelConfig } from '../state/LevelConfig';

/**
 * Decides WHEN and in WHICH column a note spawns, reading all balance values
 * from the level config. SRP: spawning policy only — it never moves, draws, or
 * scores notes.
 *
 * OCP: alternative patterns (bursts, twin notes, rhythm) can be added as new
 * `SpawnStrategy` functions without touching GameplayScene. The default weighted
 * strategy is below; swap via setStrategy().
 */

export type SpawnStrategy = (spawner: NoteSpawner) => FallingNote[];

export class NoteSpawner {
  private cooldownLeft = 0;
  private readonly xs: number[];
  private currentSpeed: number;
  private strategy: SpawnStrategy;

  constructor(private readonly cfg: LevelConfig) {
    this.xs = columnXs(cfg.columnKeys.length);
    this.currentSpeed = cfg.noteSpeedPps;
    this.strategy = NoteSpawner.weightedSingle;
  }

  setStrategy(strategy: SpawnStrategy): void {
    this.strategy = strategy;
  }

  /** Speed ramps up a little per successful hit (capped). */
  recordHit(): void {
    this.currentSpeed = Math.min(this.currentSpeed + this.cfg.speedScalingPerHit, this.cfg.noteSpeedPps * 2.4);
  }

  get speed(): number {
    return this.currentSpeed;
  }

  /** Advance the cooldown; return any notes that should spawn this frame. */
  tick(dt: number): FallingNote[] {
    this.cooldownLeft -= dt * 1000;
    if (this.cooldownLeft > 0) return [];
    this.cooldownLeft = this.cfg.spawnCooldownMs;
    return this.strategy(this);
  }

  /** Pick a column index from the weighted distribution. */
  pickColumn(): number {
    const weights = this.cfg.columnWeights;
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }
    return weights.length - 1;
  }

  makeNote(column: number): FallingNote {
    return new FallingNote(column, this.cfg.columnKeys[column], this.xs[column], this.currentSpeed);
  }

  /** Default strategy: one note, weighted toward the configured columns. */
  static weightedSingle(s: NoteSpawner): FallingNote[] {
    return [s.makeNote(s.pickColumn())];
  }
}
