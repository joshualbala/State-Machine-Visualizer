import { describe, it, expect } from "vitest";
import { hslToRgb, relativeLuminance, contrastRatio, bestTextColorForHsl, pickAccessibleAccent } from "./color";

describe("hslToRgb", () => {
  it("converts known colors exactly", () => {
    expect(hslToRgb(0, 100, 50).map(Math.round)).toEqual([255, 0, 0]);
    expect(hslToRgb(0, 0, 100).map(Math.round)).toEqual([255, 255, 255]);
    expect(hslToRgb(0, 0, 0).map(Math.round)).toEqual([0, 0, 0]);
  });
});

describe("bestTextColorForHsl", () => {
  it("picks whichever of white/near-black has the higher contrast against the background", () => {
    // A very dark background should get white text; a very light one, near-black text.
    expect(bestTextColorForHsl(264, 90, 15)).toBe("#ffffff");
    expect(bestTextColorForHsl(264, 90, 90)).toBe("#140c1f");
  });
});

describe("pickAccessibleAccent", () => {
  // The app's two accent formulas, from index.css.
  const LIGHT = { s: 90, l: 58 };
  const DARK = { s: 85, l: 74 };

  it("guarantees WCAG AA contrast (>= 4.5:1) for every hue, in both formulas", () => {
    // This is the regression test for a real bug: at the base (90, 58) light-mode formula, hues
    // ~220-282 (blue/violet) fail to reach 4.5:1 with *either* white or near-black text — both
    // land in a mid-4s valley. pickAccessibleAccent must nudge lightness/saturation for exactly
    // those hues so every hue clears the bar.
    for (let hue = 0; hue < 360; hue += 2) {
      for (const base of [LIGHT, DARK]) {
        const { saturation, lightness, textColor } = pickAccessibleAccent(hue, base.s, base.l);
        const [r, g, b] = hslToRgb(hue, saturation, lightness);
        const bgLum = relativeLuminance(r, g, b);
        const textLum = textColor === "#ffffff" ? relativeLuminance(255, 255, 255) : relativeLuminance(0x14, 0x0c, 0x1f);
        const ratio = contrastRatio(bgLum, textLum);
        expect(ratio, `hue=${hue} base=${JSON.stringify(base)} -> s=${saturation} l=${lightness}, ratio=${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("leaves hues that already pass at the base formula untouched", () => {
    // The default accent hue (264, violet-purple) already clears AA at the base light formula.
    const result = pickAccessibleAccent(264, LIGHT.s, LIGHT.l);
    expect(result.saturation).toBe(LIGHT.s);
    expect(result.lightness).toBe(LIGHT.l);
  });

  it("adjusts the small set of hues that fail at the base light formula (around 220 and 280)", () => {
    const result = pickAccessibleAccent(280, LIGHT.s, LIGHT.l);
    expect(result.lightness).not.toBe(LIGHT.l);
  });
});
