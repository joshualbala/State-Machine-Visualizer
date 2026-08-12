/** Standard CSS Color Module HSL -> sRGB conversion. h in degrees, s/l in percent. */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}

/** WCAG relative luminance of an sRGB color (0-255 channels). */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two relative luminances (1 to 21). */
function contrastRatio(l1: number, l2: number): number {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

/**
 * Picks whichever of near-white / near-black text gives better WCAG contrast against the given
 * HSL background, so accent-colored buttons/highlights stay readable across every hue a user
 * might pick, not just the ones the original palette was tuned for.
 */
export function bestTextColorForHsl(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  const bgLum = relativeLuminance(r, g, b);
  const contrastWithWhite = contrastRatio(bgLum, 1);
  const contrastWithBlack = contrastRatio(bgLum, 0);
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#140c1f";
}
