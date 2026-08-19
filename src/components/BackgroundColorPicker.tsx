import { HueWheel } from "./HueWheel";

const STORAGE_KEY = "smv-bg-hue";
const DEFAULT_HUE = 264;

function applyBackgroundHue(hue: number) {
  document.documentElement.style.setProperty("--bg-hue", String(hue));
}

export function BackgroundColorPicker() {
  return (
    <HueWheel
      storageKey={STORAGE_KEY}
      defaultHue={DEFAULT_HUE}
      triggerLabel="Change background color"
      popoverLabel="Background color"
      swatchStyle={{ background: "var(--panel-inset)" }}
      onHueChange={applyBackgroundHue}
    />
  );
}
