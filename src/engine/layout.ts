export interface Point {
  x: number;
  y: number;
}

/** Places nodes evenly around a circle, sized so more states get more room. */
export function circularLayout(ids: string[]): Record<string, Point> {
  const positions: Record<string, Point> = {};
  const n = ids.length;
  const radius = n <= 1 ? 0 : 140 + n * 25;
  const center = { x: radius + 120, y: radius + 120 };

  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions[id] = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  });

  return positions;
}
