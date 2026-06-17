/**
 * Minimal finite state machine. Used by the teacher's rage AI and (loosely)
 * by scene flow. SRP: holds a current state and validated transitions only.
 */

export interface StateNode<S extends string> {
  readonly name: S;
  /** Allowed target states. Empty = terminal. */
  readonly transitions: readonly S[];
  onEnter?(): void;
  onExit?(): void;
}

export class StateMachine<S extends string> {
  private current: S;
  private readonly nodes = new Map<S, StateNode<S>>();

  constructor(nodes: ReadonlyArray<StateNode<S>>, initial: S) {
    for (const node of nodes) this.nodes.set(node.name, node);
    if (!this.nodes.has(initial)) {
      throw new Error(`StateMachine: unknown initial state "${initial}"`);
    }
    this.current = initial;
    this.nodes.get(initial)!.onEnter?.();
  }

  get state(): S {
    return this.current;
  }

  /** Returns true if the transition was allowed and performed. */
  transition(to: S): boolean {
    if (to === this.current) return false;
    const node = this.nodes.get(this.current);
    if (!node || !node.transitions.includes(to)) return false;
    node.onExit?.();
    this.current = to;
    this.nodes.get(to)!.onEnter?.();
    return true;
  }

  /** Force a state without transition rules (used when remapping from rage value). */
  set(to: S): void {
    if (to === this.current || !this.nodes.has(to)) return;
    this.nodes.get(this.current)?.onExit?.();
    this.current = to;
    this.nodes.get(to)!.onEnter?.();
  }
}
