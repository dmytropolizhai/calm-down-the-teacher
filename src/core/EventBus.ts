/**
 * Typed publish/subscribe bus. Decouples systems: emitters never know who
 * listens. SRP: this file only does message routing.
 */

export type GameEvent =
  | { type: 'NOTE_HIT'; key: string; score: number }
  | { type: 'NOTE_MISSED'; key: string; missCount: number }
  | { type: 'RAGE_CHANGED'; rage: number }
  | { type: 'VICTORY' }
  | { type: 'DEFEAT' }
  | { type: 'SCENE_CHANGE'; to: string };

export type GameEventType = GameEvent['type'];

// Map each event type-string to its full event object for handler typing.
type EventOf<T extends GameEventType> = Extract<GameEvent, { type: T }>;
type Handler<T extends GameEventType> = (event: EventOf<T>) => void;

export class EventBus {
  private readonly handlers = new Map<GameEventType, Set<(e: GameEvent) => void>>();

  on<T extends GameEventType>(type: T, handler: Handler<T>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    const erased = handler as (e: GameEvent) => void;
    set.add(erased);
    return () => set!.delete(erased);
  }

  emit(event: GameEvent): void {
    const set = this.handlers.get(event.type);
    if (!set) return;
    // Copy so handlers may unsubscribe during dispatch without skipping peers.
    for (const handler of [...set]) handler(event);
  }

  clear(): void {
    this.handlers.clear();
  }
}
