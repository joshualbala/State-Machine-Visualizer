import { AppProvider } from "./state/AppContext";
import { JsonEditor } from "./components/JsonEditor";
import { DiagramView } from "./components/DiagramView";
import { InputRunner } from "./components/InputRunner";
import { StateInspector } from "./components/StateInspector";
import { ColorPicker } from "./components/ColorPicker";
import "./App.css";

function App() {
  return (
    <AppProvider>
      <div className="app">
        <header className="app__header">
          <h1>State Machine Visualizer</h1>
          <p>Define a state machine as JSON, run a string through it, and watch each step.</p>
          <ColorPicker />
        </header>
        <div className="app__body">
          <div className="app__panel app__panel--editor">
            <JsonEditor />
          </div>
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
