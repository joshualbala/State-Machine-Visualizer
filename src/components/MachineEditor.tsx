import { useAppContext } from "../state/AppContext";
import { JsonEditor } from "./JsonEditor";
import { TsEditor } from "./TsEditor";
import "./MachineEditor.css";

export function MachineEditor() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="machine-editor">
      <div className="machine-editor__tabs" role="tablist" aria-label="Machine authoring mode">
        <button
          type="button"
          role="tab"
          aria-selected={state.authoringMode === "json"}
          className={`machine-editor__tab${state.authoringMode === "json" ? " machine-editor__tab--active" : ""}`}
          onClick={() => dispatch({ type: "SET_MODE", mode: "json" })}
        >
          JSON
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={state.authoringMode === "typescript"}
          className={`machine-editor__tab${state.authoringMode === "typescript" ? " machine-editor__tab--active" : ""}`}
          onClick={() => dispatch({ type: "SET_MODE", mode: "typescript" })}
        >
          TypeScript
        </button>
      </div>

      <div className="machine-editor__body">{state.authoringMode === "json" ? <JsonEditor /> : <TsEditor />}</div>
    </div>
  );
}
