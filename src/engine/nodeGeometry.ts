export interface Point {
  x: number;
  y: number;
}

/**
 * A point on a circle's rim, in the direction of `direction` rotated by `rotationRad`
 * (radians, positive = clockwise in screen coordinates).
 */
export function circleBoundaryPoint(center: Point, radius: number, direction: Point, rotationRad: number): Point {
  const len = Math.hypot(direction.x, direction.y) || 1;
  const ux = direction.x / len;
  const uy = direction.y / len;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return {
    x: center.x + (ux * cos - uy * sin) * radius,
    y: center.y + (ux * sin + uy * cos) * radius,
  };
}

/** A point on a circle's rim at a clock angle in degrees (0 = straight up, positive = clockwise). */
export function polarPoint(center: Point, radius: number, angleFromUpDeg: number): Point {
  const rad = (angleFromUpDeg * Math.PI) / 180;
  return { x: center.x + radius * Math.sin(rad), y: center.y - radius * Math.cos(rad) };
}
