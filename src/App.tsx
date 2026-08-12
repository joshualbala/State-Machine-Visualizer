import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { AppProvider, useAppContext } from "./state/AppContext";
import { TsEditor } from "./components/TsEditor";
import { DiagramView } from "./components/DiagramView";
import { InputRunner } from "./components/InputRunner";
import { StateInspector } from "./components/StateInspector";
import { ColorPicker } from "./components/ColorPicker";
import "./App.css";

const STORAGE_KEY = "smv-left-width";
const MIN_LEFT_WIDTH = 280;
const MAX_LEFT_WIDTH = 720;
const DEFAULT_LEFT_WIDTH = 380;

function clampWidth(width: number): number {
  return Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, width));
}

function readStoredWidth(): number {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? clampWidth(parsed) : DEFAULT_LEFT_WIDTH;
}

function AppShell() {
  const { state } = useAppContext();
  const [leftWidth, setLeftWidth] = useState(readStoredWidth);
  const draggingRef = useRef(false);
  const hasError = Boolean(state.simulation?.erroredStep);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setLeftWidth((w) => clampWidth(w + e.movementX));
  }

  function handlePointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    localStorage.setItem(STORAGE_KEY, String(leftWidth));
  }

  function handleResizerKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 80 : 20;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = leftWidth - step;
    else if (e.key === "ArrowRight") next = leftWidth + step;
    else if (e.key === "Home") next = MIN_LEFT_WIDTH;
    else if (e.key === "End") next = MAX_LEFT_WIDTH;
    if (next === null) return;
    e.preventDefault();
    const clamped = clampWidth(next);
    setLeftWidth(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>State Machine Visualizer</h1>
        <p>Define a state machine in TypeScript, run a string through it, and watch each step.</p>
        <ColorPicker />
      </header>
      <div className="app__body" style={{ "--left-width": `${leftWidth}px` } as CSSProperties}>
        <div className="app__panel app__panel--editor" role="region" aria-label="Machine editor">
          <TsEditor />
        </div>
        <div
          className="app__resizer focus-ring-inset"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor panel"
          aria-valuemin={MIN_LEFT_WIDTH}
          aria-valuemax={MAX_LEFT_WIDTH}
          aria-valuenow={leftWidth}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleResizerKeyDown}
        />
        <div className="app__panel app__panel--diagram" role="region" aria-label="State diagram">
          <h2 className="sr-only">State diagram</h2>
          <DiagramView />
        </div>
        <div
          className={`app__panel app__panel--right${hasError ? " app__panel--right-error" : ""}`}
          role="region"
          aria-label="Input and playback"
        >
          <InputRunner />
          <StateInspector />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
