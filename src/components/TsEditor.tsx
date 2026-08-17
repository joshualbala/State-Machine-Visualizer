import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, Decoration, type DecorationSet } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { EXAMPLES, useAppContext, type TabIndex } from "../state/AppContext";
import type { LineRange } from "../engine/tsCompiler";
import "./TsEditor.css";

function highlightRangeExtension(range: LineRange | null): Extension {
  return EditorView.decorations.of((view) => {
    if (!range) return Decoration.none;
    const lastLine = view.state.doc.lines;
    const ranges = [];
    for (let l = Math.max(1, range.startLine); l <= Math.min(lastLine, range.endLine); l++) {
      const lineInfo = view.state.doc.line(l);
      ranges.push(Decoration.line({ class: "cm-activeLine-transition" }).range(lineInfo.from));
    }
    const set: DecorationSet = Decoration.set(ranges, true);
    return set;
  });
}

export function TsEditor() {
  const { state, active, dispatch } = useAppContext();
  const { tsSourceText, tsErrors, typeErrors, tsSourceMap, simulation, currentStepIndex } = active;
  const currentExample = EXAMPLES[state.activeTab];

  const currentStep = currentStepIndex >= 0 ? simulation?.steps[currentStepIndex] : undefined;
  const highlightRange = useMemo<LineRange | null>(() => {
    if (!currentStep?.transition || !tsSourceMap) return null;
    return tsSourceMap.transitions[currentStep.transition.id] ?? null;
  }, [currentStep, tsSourceMap]);

  const extensions = useMemo(() => [javascript({ typescript: true }), highlightRangeExtension(highlightRange)], [highlightRange]);

  return (
    <div className="ts-editor">
      <div className="ts-editor__tabs" role="tablist" aria-label="Example machine">
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.tabName}
            type="button"
            role="tab"
            aria-selected={state.activeTab === i}
            className={`ts-editor__tab${state.activeTab === i ? " ts-editor__tab--active" : ""}`}
            onClick={() => dispatch({ type: "SET_ACTIVE_TAB", tab: i as TabIndex })}
          >
            {ex.tabName}
          </button>
        ))}
      </div>

      <div className="ts-editor__toolbar">
        <div>
          <h2>{currentExample.title}</h2>
          <p className="ts-editor__description">{currentExample.description}</p>
        </div>
        <div className="ts-editor__buttons">
          <button type="button" onClick={() => dispatch({ type: "RESET_TO_STARTER" })}>
            Reset to starter
          </button>
          <button type="button" className="primary" onClick={() => dispatch({ type: "APPLY_TS" })}>
            Apply
          </button>
        </div>
      </div>

      <div className="ts-editor__codemirror">
        <CodeMirror
          value={tsSourceText}
          height="100%"
          theme="dark"
          extensions={extensions}
          onChange={(text) => dispatch({ type: "SET_TS_TEXT", text })}
        />
      </div>

      {tsErrors.length > 0 && (
        <div className="ts-editor__errors" role="alert">
          <h3>Machine definition errors</h3>
          <ul>
            {tsErrors.map((err, i) => (
              <li key={i}>
                {err.line ? `Line ${err.line}: ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {typeErrors.length > 0 && (
        <div className="ts-editor__errors ts-editor__errors--type" role="alert">
          <h3>TypeScript errors</h3>
          <ul>
            {typeErrors.map((err, i) => (
              <li key={i}>
                {err.line ? `Line ${err.line}: ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
