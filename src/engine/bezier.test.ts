import { describe, it, expect } from "vitest";
import { quadraticBezierPoint, cubicBezierPoint, closestTOnCurve } from "./bezier";

describe("quadraticBezierPoint", () => {
  it("returns the endpoints exactly at t=0 and t=1", () => {
    const p0 = { x: 0, y: 0 };
    const control = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };
    expect(quadraticBezierPoint(p0, control, p1, 0)).toEqual(p0);
    expect(quadraticBezierPoint(p0, control, p1, 1)).toEqual(p1);
  });

  it("returns the average-of-averages at t=0.5 (standard bezier identity)", () => {
    const p0 = { x: 0, y: 0 };
    const control = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };
    const mid = quadraticBezierPoint(p0, control, p1, 0.5);
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(50); // (0 + 2*100 + 0) / 4
  });
});

describe("cubicBezierPoint", () => {
  it("returns the endpoints exactly at t=0 and t=1", () => {
    const p0 = { x: 0, y: 0 };
    const c1 = { x: 20, y: -50 };
    const c2 = { x: 80, y: -50 };
    const p1 = { x: 100, y: 0 };
    expect(cubicBezierPoint(p0, c1, c2, p1, 0)).toEqual(p0);
    expect(cubicBezierPoint(p0, c1, c2, p1, 1)).toEqual(p1);
  });
});

describe("closestTOnCurve", () => {
  it("finds t near 0 when the target is near the start point", () => {
    const p0 = { x: 0, y: 0 };
    const control = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };
    const sample = (t: number) => quadraticBezierPoint(p0, control, p1, t);
    const t = closestTOnCurve(sample, { x: 1, y: 1 });
    expect(t).toBeLessThan(0.05);
  });

  it("finds t near 1 when the target is near the end point", () => {
    const p0 = { x: 0, y: 0 };
    const control = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };
    const sample = (t: number) => quadraticBezierPoint(p0, control, p1, t);
    const t = closestTOnCurve(sample, { x: 99, y: 1 });
    expect(t).toBeGreaterThan(0.95);
  });

  it("finds a point genuinely on the curve, not just close to the target in a straight line", () => {
    // A point far from the curve should still project onto the curve's actual midpoint region.
    const p0 = { x: 0, y: 0 };
    const control = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };
    const sample = (t: number) => quadraticBezierPoint(p0, control, p1, t);
    const t = closestTOnCurve(sample, { x: 50, y: 200 }); // way above the curve's peak
    const projected = sample(t);
    // The curve's own peak is at (50, 50) (t=0.5); projecting a point directly above it
    // should land back near t=0.5, not drift toward an endpoint.
    expect(t).toBeCloseTo(0.5, 1);
    expect(projected.y).toBeLessThan(200);
  });
});
