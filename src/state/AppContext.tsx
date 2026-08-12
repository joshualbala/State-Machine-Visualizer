import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { simulate, type SimulationResult } from "../engine/simulate";
import type { StateMachineDef } from "../types/stateMachine";
import { compileTypeScript, type CompileError, type TsSourceMap } from "../engine/tsCompiler";
import { tsStarterSource } from "../examples/tsStarter";

interface AppState {
  tsSourceText: string;
  tsErrors: CompileError[];
  tsSourceMap: TsSourceMap | null;

  machine: StateMachineDef | null;

  inputString: string;
  simulation: SimulationResult | null;
  currentStepIndex: number; // -1 = initial state, before any steps have run
  isPlaying: boolean;
}

type Action =
  | { type: "SET_TS_TEXT"; text: string }
  | { type: "APPLY_TS" }
  | { type: "LOAD_TS_EXAMPLE"; source: string }
  | { type: "SET_INPUT"; value: string }
  | { type: "RUN" }
  | { type: "GOTO_STEP"; index: number }
  | { type: "STEP_FORWARD" }
  | { type: "STEP_BACKWARD" }
  | { type: "RESET_PLAYBACK" }
  | { type: "PLAY" }
  | { type: "PAUSE" };

function initialState(): AppState {
  const tsResult = compileTypeScript(tsStarterSource);
  return {
    tsSourceText: tsStarterSource,
    tsErrors: tsResult.ok ? [] : tsResult.errors,
    tsSourceMap: tsResult.ok ? tsResult.sourceMap : null,

    machine: tsResult.ok ? tsResult.machine : null,

    inputString: "hello",
    simulation: null,
    currentStepIndex: -1,
    isPlaying: false,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TS_TEXT":
      return { ...state, tsSourceText: action.text };

    case "APPLY_TS": {
      const result = compileTypeScript(state.tsSourceText);
      if (!result.ok) {
        return { ...state, tsErrors: result.errors, simulation: null, currentStepIndex: -1, isPlaying: false };
      }
      return {
        ...state,
        machine: result.machine,
        tsErrors: [],
        tsSourceMap: result.sourceMap,
        simulation: null,
        currentStepIndex: -1,
        isPlaying: false,
      };
    }

    case "LOAD_TS_EXAMPLE": {
      const result = compileTypeScript(action.source);
      return {
        ...state,
        tsSourceText: action.source,
        machine: result.ok ? result.machine : state.machine,
        tsErrors: result.ok ? [] : result.errors,
        tsSourceMap: result.ok ? result.sourceMap : null,
        simulation: null,
        currentStepIndex: -1,
        isPlaying: false,
      };
    }

    case "SET_INPUT":
      return { ...state, inputString: action.value, simulation: null, currentStepIndex: -1, isPlaying: false };

    case "RUN": {
      if (!state.machine) return state;
      const simulation = simulate(state.machine, state.inputString);
      // If the run ended in an error state, land on that step so the source line and
      // offending character are immediately visible instead of requiring a manual step.
      const currentStepIndex = simulation.erroredStep ? simulation.erroredStep.index : -1;
      return { ...state, simulation, currentStepIndex, isPlaying: false };
    }

    case "GOTO_STEP": {
      if (!state.simulation) return state;
      const max = state.simulation.steps.length - 1;
      const index = Math.max(-1, Math.min(action.index, max));
      return { ...state, currentStepIndex: index };
    }

    case "STEP_FORWARD": {
      if (!state.simulation) return state;
      const max = state.simulation.steps.length - 1;
      if (state.currentStepIndex >= max) return { ...state, isPlaying: false };
      return { ...state, currentStepIndex: state.currentStepIndex + 1 };
    }

    case "STEP_BACKWARD": {
      if (!state.simulation) return state;
      return { ...state, currentStepIndex: Math.max(-1, state.currentStepIndex - 1), isPlaying: false };
    }

    case "RESET_PLAYBACK":
      return { ...state, currentStepIndex: -1, isPlaying: false };

    case "PLAY":
      if (!state.simulation || state.currentStepIndex >= state.simulation.steps.length - 1) return state;
      return { ...state, isPlaying: true };

    case "PAUSE":
      return { ...state, isPlaying: false };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
