import { useEffect, useRef, useState } from "react";
import "./ColorPicker.css";

const STORAGE_KEY = "smv-accent-hue";
const DEFAULT_HUE = 264;

function applyHue(hue: number) {
  document.documentElement.style.setProperty("--accent-hue", String(hue));
}

function readStoredHue(): number {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? ((parsed % 360) + 360) % 360 : DEFAULT_HUE;
}

function angleFromPointer(center: { x: number; y: number }, px: number, py: number): number {
  const dx = px - center.x;
  const dy = py - center.y;
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

export function ColorPicker() {
  const [open, setOpen] = useState(false);
  const [hue, setHue] = useState<number>(() => readStoredHue());
  const wheelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    applyHue(hue);
  }, [hue]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as globalThis.Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function updateHueFromPointer(clientX: number, clientY: number) {
    const wheel = wheelRef.current;
    if (!wheel) return;
    const rect = wheel.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setHue(angleFromPointer(center, clientX, clientY));
  }

  function handlePointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateHueFromPointer(e.clientX, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    updateHueFromPointer(e.clientX, e.clientY);
  }

  function handlePointerUp() {
    draggingRef.current = false;
    localStorage.setItem(STORAGE_KEY, String(Math.round(hue)));
  }

  function reset() {
    setHue(DEFAULT_HUE);
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_HUE));
  }

  const knobAngleRad = (hue * Math.PI) / 180;
  const knobX = 50 + 42 * Math.sin(knobAngleRad);
  const knobY = 50 - 42 * Math.cos(knobAngleRad);

  return (
    <div className="color-picker" ref={containerRef}>
      <button type="button" className="color-picker__trigger" onClick={() => setOpen((o) => !o)} title="Change accent color" aria-label="Change accent color">
        <span className="color-picker__swatch" />
      </button>

      {open && (
        <div className="color-picker__popover" role="dialog" aria-label="Accent color picker">
          <div
            className="color-picker__wheel"
            ref={wheelRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="color-picker__wheel-center" />
            <div className="color-picker__knob" style={{ left: `${knobX}%`, top: `${knobY}%` }} />
          </div>
          <div className="color-picker__footer">
            <span className="color-picker__label">Accent color</span>
            <button type="button" onClick={reset}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
