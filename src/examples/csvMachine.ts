import type { StateMachineDef } from "../types/stateMachine";

/**
 * Classic two-state CSV field parser.
 * States: "Start of Field" (about to read the first char of a field)
 *         "Inside Field" (partway through a field's characters)
 * Variables: currentField (string being built), currentRecord (fields seen so far
 *            in the current line), records (completed records).
 */
export const csvMachine: StateMachineDef = {
  name: "CSV Parser",
  description:
    "Parses a comma-separated line character by character, building up fields, records, and a list of records.",
  startState: "startOfField",
  variables: {
    currentField: "",
    currentRecord: [],
    records: [],
  },
  states: [
    { id: "startOfField", label: "Start of Field" },
    { id: "insideField", label: "Inside Field" },
  ],
  transitions: [
    {
      id: "sof-comma",
      from: "startOfField",
      to: "startOfField",
      label: "comma (empty field)",
      condition: { type: "charEquals", value: "," },
      actions: [
        { type: "push", target: "currentRecord", value: { kind: "var", name: "currentField" } },
        { type: "set", target: "currentField", value: { kind: "literal", value: "" } },
      ],
    },
    {
      id: "sof-newline",
      from: "startOfField",
      to: "startOfField",
      label: "newline (end record)",
      condition: { type: "charEquals", value: "\n" },
      actions: [
        { type: "push", target: "currentRecord", value: { kind: "var", name: "currentField" } },
        { type: "set", target: "currentField", value: { kind: "literal", value: "" } },
        { type: "push", target: "records", value: { kind: "var", name: "currentRecord" } },
        { type: "set", target: "currentRecord", value: { kind: "literal", value: [] } },
      ],
    },
    {
      id: "sof-other",
      from: "startOfField",
      to: "insideField",
      label: "other char",
      condition: { type: "else" },
      actions: [{ type: "append", target: "currentField", value: { kind: "char" } }],
    },
    {
      id: "sof-eoi",
      from: "startOfField",
      to: "startOfField",
      label: "end of input",
      condition: { type: "endOfInput" },
      actions: [
        { type: "push", target: "currentRecord", value: { kind: "var", name: "currentField" } },
        { type: "set", target: "currentField", value: { kind: "literal", value: "" } },
        { type: "push", target: "records", value: { kind: "var", name: "currentRecord" } },
        { type: "set", target: "currentRecord", value: { kind: "literal", value: [] } },
      ],
    },
    {
      id: "if-comma",
      from: "insideField",
      to: "startOfField",
      label: "comma (end field)",
      condition: { type: "charEquals", value: "," },
      actions: [
        { type: "push", target: "currentRecord", value: { kind: "var", name: "currentField" } },
        { type: "set", target: "currentField", value: { kind: "literal", value: "" } },
      ],
    },
    {
      id: "if-newline",
      from: "insideField",
      to: "startOfField",
      label: "newline (end record)",
      condition: { type: "charEquals", value: "\n" },
      actions: [
        { type: "push", target: "currentRecord", value: { kind: "var", name: "currentField" } },
        { type: "set", target: "currentField", value: { kind: "literal", value: "" } },
        { type: "push", target: "records", value: { kind: "var", name: "currentRecord" } },
        { type: "set", target: "currentRecord", value: { kind: "literal", value: [] } },
      ],
    },
    {
      id: "if-other",
      from: "insideField",
      to: "insideField",
      label: "other char",
      condition: { type: "else" },
      actions: [{ type: "append", target: "currentField", value: { kind: "char" } }],
    },
    {
      id: "if-eoi",
      from: "insideField",
      to: "startOfField",
      label: "end of input",
      condition: { type: "endOfInput" },
      actions: [
        { type: "push", target: "currentRecord", value: { kind: "var", name: "currentField" } },
        { type: "set", target: "currentField", value: { kind: "literal", value: "" } },
        { type: "push", target: "records", value: { kind: "var", name: "currentRecord" } },
        { type: "set", target: "currentRecord", value: { kind: "literal", value: [] } },
      ],
    },
  ],
};
