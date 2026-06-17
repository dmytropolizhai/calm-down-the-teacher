import type { FallingNote } from '../entities/FallingNote';
import { NOTE_SIZE } from '../entities/FallingNote';

export interface HitZone {
  readonly top: number; // logical y
  readonly bottom: number; // logical y
}

/**
 * Pure-ish evaluation of whether a press lands a note. SRP: it only judges
 * geometry/keys; it does not mutate score, rage, or spawn anything. The scene
 * decides what to do with the verdict.
 */
export class HitDetector {
  constructor(private zone: HitZone) {}

  setZone(zone: HitZone): void {
    this.zone = zone;
  }

  /** Is the note's body currently overlapping the hit zone? */
  inZone(note: FallingNote): boolean {
    const center = note.y + NOTE_SIZE / 2;
    return center >= this.zone.top && center <= this.zone.bottom;
  }

  /** Has the note fallen past the zone without being hit? */
  belowZone(note: FallingNote): boolean {
    return note.y + NOTE_SIZE / 2 > this.zone.bottom;
  }

  /**
   * Find the best note to award for a pressed key: the in-zone, live note with
   * the matching key that is lowest (closest to the line). Returns null if none.
   */
  resolve(key: string, notes: readonly FallingNote[]): FallingNote | null {
    let best: FallingNote | null = null;
    for (const note of notes) {
      if (note.hit || note.missed) continue;
      if (note.key !== key) continue;
      if (!this.inZone(note)) continue;
      if (!best || note.y > best.y) best = note;
    }
    return best;
  }
}
