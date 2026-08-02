import { useAppContext } from "../state/AppContext";
import { csvMachine } from "../examples/csvMachine";
import "./JsonEditor.css";

export function JsonEditor() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="json-editor">
      <div className="json-editor__toolbar">
        <h2>Machine definition</h2>
        <div className="json-editor__buttons">
          <button type="button" onClick={() => dispatch({ type: "LOAD_MACHINE", machine: csvMachine })}>
            Load CSV example
          </button>
          <button type="button" className="primary" onClick={() => dispatch({ type: "APPLY_JSON" })}>
            Apply
          </button>
        </div>
      </div>

      <textarea
        className="json-editor__textarea"
        spellCheck={false}
        value={state.machineJsonText}
        onChange={(e) => dispatch({ type: "SET_JSON_TEXT", text: e.target.value })}
      />

      {state.jsonErrors.length > 0 && (
        <ul className="json-editor__errors">
          {state.jsonErrors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}

      {state.jsonErrors.length === 0 && state.machine && (
        <p className="json-editor__status">
          Loaded "{state.machine.name}" — {state.machine.states.length} states, {state.machine.transitions.length}{" "}
          transitions.
        </p>
      )}
    </div>
  );
}
