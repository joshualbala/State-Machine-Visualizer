import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { AppProvider } from "./state/AppContext";
import { MachineEditor } from "./components/MachineEditor";
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

function App() {
  const [leftWidth, setLeftWidth] = useState(readStoredWidth);
  const draggingRef = useRef(false);

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

  return (
    <AppProvider>
      <div className="app">
        <header className="app__header">
          <h1>State Machine Visualizer</h1>
          <p>Define a state machine as JSON or TypeScript, run a string through it, and watch each step.</p>
          <ColorPicker />
        </header>
        <div className="app__body" style={{ "--left-width": `${leftWidth}px` } as CSSProperties}>
          <div className="app__panel app__panel--editor">
            <MachineEditor />
          </div>
          <div
            className="app__resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor panel"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div className="app__panel app__panel--diagram">
            <DiagramView />
          </div>
          <div className="app__panel app__panel--right">
            <InputRunner />
            <StateInspector />
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
