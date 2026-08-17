import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { simulate, type SimulationResult } from "../engine/simulate";
import type { StateMachineDef } from "../types/stateMachine";
import { compileTypeScript, type CompileError, type TsSourceMap } from "../engine/tsCompiler";
import { typeCheckTypeScript, type TypeCheckError } from "../engine/tsTypeCheck";
import { example1 } from "../examples/example1";
import { example2 } from "../examples/example2";
import { example3 } from "../examples/example3";

export const EXAMPLES = [example1, example2, example3] as const;
export type TabIndex = 0 | 1 | 2;

interface ExampleState {
  tsSourceText: string;
  tsErrors: CompileError[];
  typeErrors: TypeCheckError[];
  tsSourceMap: TsSourceMap | null;

  machine: StateMachineDef | null;

  inputString: string;
  simulation: SimulationResult | null;
  currentStepIndex: number; // -1 = initial state, before any steps have run
  isPlaying: boolean;
}

interface AppState {
  activeTab: TabIndex;
  examples: [ExampleState, ExampleState, ExampleState];
}

type Action =
  | { type: "SET_ACTIVE_TAB"; tab: TabIndex }
  | { type: "SET_TS_TEXT"; text: string }
  | { type: "APPLY_TS" }
  | { type: "RESET_TO_STARTER" }
  | { type: "SET_INPUT"; value: string }
  | { type: "RUN" }
  | { type: "GOTO_STEP"; index: number }
  | { type: "STEP_FORWARD" }
  | { type: "STEP_BACKWARD" }
  | { type: "RESET_PLAYBACK" }
  | { type: "PLAY" }
  | { type: "PAUSE" };

function compileAndCheck(source: string): { tsErrors: CompileError[]; typeErrors: TypeCheckError[]; machine: StateMachineDef | null; tsSourceMap: TsSourceMap | null } {
  const typeErrors = typeCheckTypeScript(source);
  const result = compileTypeScript(source);
  if (!result.ok) {
    return { tsErrors: result.errors, typeErrors, machine: null, tsSourceMap: null };
  }
  return { tsErrors: [], typeErrors, machine: result.machine, tsSourceMap: result.sourceMap };
}

function createExampleState(source: string): ExampleState {
  const { tsErrors, typeErrors, machine, tsSourceMap } = compileAndCheck(source);
  return {
    tsSourceText: source,
    tsErrors,
    typeErrors,
    tsSourceMap,
    machine,
    inputString: "",
    simulation: null,
    currentStepIndex: -1,
    isPlaying: false,
  };
}

function emptyExampleState(): ExampleState {
  return {
    tsSourceText: "",
    tsErrors: [],
    typeErrors: [],
    tsSourceMap: null,
    machine: null,
    inputString: "",
    simulation: null,
    currentStepIndex: -1,
    isPlaying: false,
  };
}

function initialState(): AppState {
  return {
    activeTab: 0,
    examples: [emptyExampleState(), emptyExampleState(), emptyExampleState()],
  };
}

function updateActive(state: AppState, updater: (ex: ExampleState) => ExampleState): AppState {
  const examples = [...state.examples] as AppState["examples"];
  examples[state.activeTab] = updater(examples[state.activeTab]);
  return { ...state, examples };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ACTIVE_TAB": {
      const examples = [...state.examples] as AppState["examples"];
      // Load a tab's starter the first time it's opened, without clobbering anything the user
      // has already typed into it (switching away and back preserves edits).
      if (examples[action.tab].tsSourceText === "") {
        examples[action.tab] = createExampleState(EXAMPLES[action.tab].source);
      }
      return { ...state, activeTab: action.tab, examples };
    }

    case "SET_TS_TEXT":
      return updateActive(state, (ex) => ({ ...ex, tsSourceText: action.text }));

    case "APPLY_TS":
      return updateActive(state, (ex) => {
        const { tsErrors, typeErrors, machine, tsSourceMap } = compileAndCheck(ex.tsSourceText);
        return {
          ...ex,
          tsErrors,
          typeErrors,
          machine: machine ?? ex.machine,
          tsSourceMap: tsSourceMap ?? ex.tsSourceMap,
          simulation: null,
          currentStepIndex: -1,
          isPlaying: false,
        };
      });

    case "RESET_TO_STARTER":
      return updateActive(state, () => createExampleState(EXAMPLES[state.activeTab].source));

    case "SET_INPUT":
      return updateActive(state, (ex) => ({ ...ex, inputString: action.value, simulation: null, currentStepIndex: -1, isPlaying: false }));

    case "RUN":
      return updateActive(state, (ex) => {
        if (!ex.machine) return ex;
        const simulation = simulate(ex.machine, ex.inputString);
        const currentStepIndex = simulation.erroredStep ? simulation.erroredStep.index : -1;
        return { ...ex, simulation, currentStepIndex, isPlaying: false };
      });

    case "GOTO_STEP":
      return updateActive(state, (ex) => {
        if (!ex.simulation) return ex;
        const max = ex.simulation.steps.length - 1;
        const index = Math.max(-1, Math.min(action.index, max));
        return { ...ex, currentStepIndex: index };
      });

    case "STEP_FORWARD":
      return updateActive(state, (ex) => {
        if (!ex.simulation) return ex;
        const max = ex.simulation.steps.length - 1;
        if (ex.currentStepIndex >= max) return { ...ex, isPlaying: false };
        return { ...ex, currentStepIndex: ex.currentStepIndex + 1 };
      });

    case "STEP_BACKWARD":
      return updateActive(state, (ex) => {
        if (!ex.simulation) return ex;
        return { ...ex, currentStepIndex: Math.max(-1, ex.currentStepIndex - 1), isPlaying: false };
      });

    case "RESET_PLAYBACK":
      return updateActive(state, (ex) => ({ ...ex, currentStepIndex: -1, isPlaying: false }));

    case "PLAY":
      return updateActive(state, (ex) => {
        if (!ex.simulation || ex.currentStepIndex >= ex.simulation.steps.length - 1) return ex;
        return { ...ex, isPlaying: true };
      });

    case "PAUSE":
      return updateActive(state, (ex) => ({ ...ex, isPlaying: false }));

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  active: ExampleState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, active: state.examples[state.activeTab], dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
