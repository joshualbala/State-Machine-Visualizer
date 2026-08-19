import { pickAccessibleAccent } from "../engine/color";
import { HueWheel } from "./HueWheel";

const STORAGE_KEY = "smv-accent-hue";
const DEFAULT_HUE = 264;
const LIGHT_S = 90;
const LIGHT_L = 58;
const DARK_S = 85;
const DARK_L = 74;

function applyAccentHue(hue: number) {
  const light = pickAccessibleAccent(hue, LIGHT_S, LIGHT_L);
  const dark = pickAccessibleAccent(hue, DARK_S, DARK_L);
  const root = document.documentElement.style;
  root.setProperty("--accent-hue", String(hue));
  root.setProperty("--accent-saturation-light", `${light.saturation}%`);
  root.setProperty("--accent-lightness-light", `${light.lightness}%`);
  root.setProperty("--accent-contrast-light", light.textColor);
  root.setProperty("--accent-saturation-dark", `${dark.saturation}%`);
  root.setProperty("--accent-lightness-dark", `${dark.lightness}%`);
  root.setProperty("--accent-contrast-dark", dark.textColor);
}

export function ColorPicker() {
  return (
    <HueWheel
      storageKey={STORAGE_KEY}
      defaultHue={DEFAULT_HUE}
      triggerLabel="Change accent color"
      popoverLabel="Accent color"
      swatchStyle={{ background: "var(--accent)" }}
      onHueChange={applyAccentHue}
    />
  );
}
