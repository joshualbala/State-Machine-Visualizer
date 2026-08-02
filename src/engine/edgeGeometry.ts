import type { TransitionDef } from "../types/stateMachine";

export interface EdgeGeometry {
  transitionId: string;
  isSelfLoop: boolean;
  /** Index within its group, centered around 0 (e.g. -1, 0, 1) so parallel edges fan out symmetrically. */
  offsetIndex: number;
  /**
   * Only meaningful for non-self-loop edges. True when this transition's `from`/`to` run opposite
   * to the group's canonical direction (the two state ids sorted ascending). Used to normalize the
   * fan-out offset so an A->B edge and a B->A edge between the same two states curve to consistently
   * different sides instead of mirroring on top of each other.
   */
  flip: boolean;
}

/**
 * Groups transitions that connect the same pair of states (regardless of direction) or
 * loop on the same state, and assigns each a centered offset index so multiple edges
 * between the same nodes can be drawn as separate, non-overlapping curves.
 */
export function computeEdgeGeometry(transitions: TransitionDef[]): Map<string, EdgeGeometry> {
  const groups = new Map<string, TransitionDef[]>();

  for (const t of transitions) {
    const key = t.from === t.to ? `loop:${t.from}` : `pair:${[t.from, t.to].sort().join("|")}`;
    const group = groups.get(key) ?? [];
    group.push(t);
    groups.set(key, group);
  }

  const result = new Map<string, EdgeGeometry>();
  for (const group of groups.values()) {
    const n = group.length;
    group.forEach((t, i) => {
      const isSelfLoop = t.from === t.to;
      result.set(t.id, {
        transitionId: t.id,
        isSelfLoop,
        offsetIndex: i - (n - 1) / 2,
        flip: !isSelfLoop && t.from > t.to,
      });
    });
  }
  return result;
}
