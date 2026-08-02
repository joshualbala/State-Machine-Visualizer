import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, Decoration, type DecorationSet } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { useAppContext } from "../state/AppContext";
import { tsStarterSource } from "../examples/tsStarter";
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
  const { state, dispatch } = useAppContext();
  const { tsSourceText, tsErrors, tsSourceMap, simulation, currentStepIndex } = state;

  const currentStep = currentStepIndex >= 0 ? simulation?.steps[currentStepIndex] : undefined;
  const highlightRange = useMemo<LineRange | null>(() => {
    if (!currentStep?.transition || !tsSourceMap) return null;
    return tsSourceMap.transitions[currentStep.transition.id] ?? null;
  }, [currentStep, tsSourceMap]);

  const extensions = useMemo(() => [javascript({ typescript: true }), highlightRangeExtension(highlightRange)], [highlightRange]);

  return (
    <div className="ts-editor">
      <div className="ts-editor__toolbar">
        <h2>Machine definition (TypeScript)</h2>
        <div className="ts-editor__buttons">
          <button type="button" onClick={() => dispatch({ type: "LOAD_TS_EXAMPLE", source: tsStarterSource })}>
            Load starter example
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
        <ul className="ts-editor__errors">
          {tsErrors.map((err, i) => (
            <li key={i}>
              {err.line ? `Line ${err.line}: ` : ""}
              {err.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
