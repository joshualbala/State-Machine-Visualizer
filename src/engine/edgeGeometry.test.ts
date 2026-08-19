import { describe, it, expect } from "vitest";
import { computeEdgeGeometry } from "./edgeGeometry";
import type { TransitionDef } from "../types/stateMachine";

function t(id: string, from: string, to: string): TransitionDef {
  return { id, from, to, condition: { type: "else" }, actions: [] };
}

describe("computeEdgeGeometry", () => {
  it("gives a single edge between two states offsetIndex 0 and no flip", () => {
    const geo = computeEdgeGeometry([t("e1", "A", "B")]);
    expect(geo.get("e1")).toEqual({ transitionId: "e1", isSelfLoop: false, offsetIndex: 0, flip: false });
  });

  it("flips the canonical direction when from > to alphabetically", () => {
    const geo = computeEdgeGeometry([t("e1", "B", "A")]);
    expect(geo.get("e1")).toMatchObject({ isSelfLoop: false, flip: true });
  });

  it("centers offset indices for a group of self-loops on the same state", () => {
    const geo = computeEdgeGeometry([t("loop1", "A", "A"), t("loop2", "A", "A"), t("loop3", "A", "A")]);
    expect(geo.get("loop1")).toMatchObject({ isSelfLoop: true, offsetIndex: -1 });
    expect(geo.get("loop2")).toMatchObject({ isSelfLoop: true, offsetIndex: 0 });
    expect(geo.get("loop3")).toMatchObject({ isSelfLoop: true, offsetIndex: 1 });
  });

  it("does not confuse self-loops on different states for the same group", () => {
    const geo = computeEdgeGeometry([t("loopA", "A", "A"), t("loopB", "B", "B")]);
    expect(geo.get("loopA")).toMatchObject({ offsetIndex: 0 });
    expect(geo.get("loopB")).toMatchObject({ offsetIndex: 0 });
  });

  it("groups edges between the same two states regardless of direction, and assigns each a distinct offset", () => {
    const transitions = [t("ab1", "A", "B"), t("ba1", "B", "A"), t("ab2", "A", "B"), t("ba2", "B", "A")];
    const geo = computeEdgeGeometry(transitions);
    const offsets = transitions.map((tr) => geo.get(tr.id)!.offsetIndex);
    // Four members of one group: centered, evenly spaced, every offset distinct.
    expect(new Set(offsets).size).toBe(4);
    expect(offsets.reduce((a, b) => a + b, 0)).toBeCloseTo(0);
    // flip is determined per-transition by its own direction, independent of position in the group.
    expect(geo.get("ab1")).toMatchObject({ flip: false });
    expect(geo.get("ba1")).toMatchObject({ flip: true });
    expect(geo.get("ab2")).toMatchObject({ flip: false });
    expect(geo.get("ba2")).toMatchObject({ flip: true });
  });

  it("keeps unrelated state pairs in separate groups", () => {
    const geo = computeEdgeGeometry([t("ab", "A", "B"), t("cd", "C", "D")]);
    expect(geo.get("ab")).toMatchObject({ offsetIndex: 0 });
    expect(geo.get("cd")).toMatchObject({ offsetIndex: 0 });
  });
});
