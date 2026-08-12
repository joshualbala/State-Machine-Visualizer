import { matchesCondition, resolveValue } from "./expression";
import type { ActionSpec, JsonValue, StateMachineDef, TransitionDef } from "../types/stateMachine";

export interface SimStep {
  index: number;
  /** Position in the input string of the character consumed this step (input.length for the end-of-input event). */
  position: number;
  char: string | null;
  fromState: string;
  toState: string | null;
  transition: TransitionDef | null;
  variablesBefore: Record<string, JsonValue>;
  variablesAfter: Record<string, JsonValue>;
  /** True when no transition matched the event: the machine could not continue. */
  stuck: boolean;
  /** True when this step transitioned into a state flagged `isError`. */
  errored: boolean;
}

export interface SimulationResult {
  steps: SimStep[];
  finalState: string;
  finalVariables: Record<string, JsonValue>;
  /** True if the machine ran out of applicable transitions before consuming the whole input. */
  stuck: boolean;
  /** The step that entered an error state, if the run ended that way. The run stops there immediately. */
  erroredStep: SimStep | null;
}

function findTransition(
  machine: StateMachineDef,
  fromState: string,
  char: string | null
): TransitionDef | undefined {
  return machine.transitions.find((t) => t.from === fromState && matchesCondition(t.condition, char));
}

function applyActions(
  actions: ActionSpec[],
  char: string | null,
  variables: Record<string, JsonValue>
): Record<string, JsonValue> {
  const next = structuredClone(variables);
  for (const action of actions) {
    const value = resolveValue(action.value, char, next);
    switch (action.type) {
      case "set":
        next[action.target] = value;
        break;
      case "append": {
        const current = next[action.target];
        next[action.target] = (typeof current === "string" ? current : "") + (typeof value === "string" ? value : String(value ?? ""));
        break;
      }
      case "push": {
        const current = next[action.target];
        next[action.target] = Array.isArray(current) ? [...current, value] : [value];
        break;
      }
    }
  }
  return next;
}

/** Runs a machine over an input string, producing a full step-by-step trace. */
export function simulate(machine: StateMachineDef, input: string): SimulationResult {
  const errorStateIds = new Set(machine.states.filter((s) => s.isError).map((s) => s.id));
  const steps: SimStep[] = [];
  let currentState = machine.startState;
  let variables = structuredClone(machine.variables);
  let stuck = false;
  let erroredStep: SimStep | null = null;

  for (let position = 0; position <= input.length; position++) {
    const isEndOfInput = position === input.length;
    const char = isEndOfInput ? null : input[position];
    const transition = findTransition(machine, currentState, char);

    if (!transition) {
      // For end-of-input, having no matching transition just means "stop here" (no side effect needed).
      if (!isEndOfInput) {
        stuck = true;
        steps.push({
          index: steps.length,
          position,
          char,
          fromState: currentState,
          toState: null,
          transition: null,
          variablesBefore: variables,
          variablesAfter: variables,
          stuck: true,
          errored: false,
        });
      }
      break;
    }

    const variablesBefore = variables;
    const variablesAfter = applyActions(transition.actions, char, variables);
    const entersError = errorStateIds.has(transition.to);

    const step: SimStep = {
      index: steps.length,
      position,
      char,
      fromState: currentState,
      toState: transition.to,
      transition,
      variablesBefore,
      variablesAfter,
      stuck: false,
      errored: entersError,
    };
    steps.push(step);

    variables = variablesAfter;
    currentState = transition.to;

    if (entersError) {
      // Reaching an error state ends the run immediately: don't consume any more input.
      erroredStep = step;
      break;
    }

    if (isEndOfInput) break;
  }

  return { steps, finalState: currentState, finalVariables: variables, stuck, erroredStep };
}
