import { describe, it, expect } from "vitest";
import { simulate } from "./simulate";
import type { StateMachineDef } from "../types/stateMachine";

const toggleMachine: StateMachineDef = {
  name: "toggle",
  startState: "stateA",
  variables: { log: "" },
  states: [
    { id: "stateA", label: "State A" },
    { id: "stateB", label: "State B" },
  ],
  transitions: [
    { id: "a-eoi", from: "stateA", to: "stateA", condition: { type: "endOfInput" }, actions: [] },
    {
      id: "a-else",
      from: "stateA",
      to: "stateB",
      condition: { type: "else" },
      actions: [{ type: "append", target: "log", value: { kind: "char" } }],
    },
    { id: "b-eoi", from: "stateB", to: "stateB", condition: { type: "endOfInput" }, actions: [] },
    {
      id: "b-else",
      from: "stateB",
      to: "stateA",
      condition: { type: "else" },
      actions: [{ type: "append", target: "log", value: { kind: "char" } }],
    },
  ],
};

describe("simulate", () => {
  it("runs a basic machine to completion, accumulating variables via actions", () => {
    const result = simulate(toggleMachine, "hello");
    expect(result.stuck).toBe(false);
    expect(result.erroredStep).toBeNull();
    expect(result.finalVariables.log).toBe("hello");
    // 5 characters toggle stateA -> stateB five times, ending on stateB (odd count).
    expect(result.finalState).toBe("stateB");
    // 5 chars + 1 end-of-input event
    expect(result.steps).toHaveLength(6);
  });

  it("fires the endOfInput transition with char === null", () => {
    const result = simulate(toggleMachine, "x");
    const lastStep = result.steps.at(-1)!;
    expect(lastStep.char).toBeNull();
    expect(lastStep.transition?.condition.type).toBe("endOfInput");
  });

  it("marks the run stuck when no transition matches mid-string, and halts immediately", () => {
    const machine: StateMachineDef = {
      name: "strict",
      startState: "s1",
      variables: {},
      states: [{ id: "s1", label: "s1" }],
      transitions: [{ id: "only-a", from: "s1", to: "s1", condition: { type: "charEquals", value: "a" }, actions: [] }],
    };
    const result = simulate(machine, "aab");
    expect(result.stuck).toBe(true);
    // 2 successful 'a' steps + 1 stuck step recorded at the 'b'
    expect(result.steps).toHaveLength(3);
    const stuckStep = result.steps.at(-1)!;
    expect(stuckStep.stuck).toBe(true);
    expect(stuckStep.char).toBe("b");
  });

  it("halts silently (not stuck) when no transition matches at end-of-input", () => {
    const machine: StateMachineDef = {
      name: "no-eoi-handler",
      startState: "s1",
      variables: {},
      states: [{ id: "s1", label: "s1" }],
      transitions: [{ id: "only-a", from: "s1", to: "s1", condition: { type: "charEquals", value: "a" }, actions: [] }],
    };
    const result = simulate(machine, "aa");
    expect(result.stuck).toBe(false);
    expect(result.steps).toHaveLength(2);
  });

  it("halts immediately on entering an error state, without consuming further input", () => {
    const machine: StateMachineDef = {
      name: "errors",
      startState: "reading",
      variables: { text: "" },
      states: [
        { id: "reading", label: "Reading" },
        { id: "error", label: "Error", isError: true },
      ],
      transitions: [
        { id: "eoi", from: "reading", to: "reading", condition: { type: "endOfInput" }, actions: [] },
        { id: "bang", from: "reading", to: "error", condition: { type: "charEquals", value: "!" }, actions: [] },
        {
          id: "other",
          from: "reading",
          to: "reading",
          condition: { type: "else" },
          actions: [{ type: "append", target: "text", value: { kind: "char" } }],
        },
        { id: "error-self", from: "error", to: "error", condition: { type: "else" }, actions: [] },
      ],
    };
    const result = simulate(machine, "hi!there");
    expect(result.finalState).toBe("error");
    expect(result.erroredStep).not.toBeNull();
    expect(result.erroredStep!.char).toBe("!");
    expect(result.erroredStep!.position).toBe(2);
    // Stops right after "hi!" — "there" is never consumed.
    expect(result.steps).toHaveLength(3);
    expect(result.finalVariables.text).toBe("hi");
  });
});
