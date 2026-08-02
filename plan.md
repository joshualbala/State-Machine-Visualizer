# Plan Log

A running log of explicit plans and instructions given during this project. Not every prompt is recorded here — only ones that set direction, scope, or an actionable plan.

## 2026-07-21
- Set up this file (`plan.md`) to log explicit plans going forward, rather than every prompt sent.

### Project scope: State Machine Visualizer (education)
Build a visualizer for finite state machines that process a string character-by-character, where transitions ("arrows") have side effects that mutate program values (e.g. building up CSV fields/records).

Core functionality required:
1. Create/edit a state machine via JSON input (states, transitions, conditions, side-effect actions).
2. Run an example input string through a created state machine and watch it execute step by step.
3. View/inspect the state at each step (current state, position in input, current values of program variables).

Motivating example: CSV field parser with two states ("Start of Field", "Inside Field"). Transitions triggered by character class (comma, newline, other) that append to a current field, end a field, end a record, etc.

### Stack decision
- Vite + React + TypeScript (SPA), deployed as static assets. Chosen over Next.js since the tool is client-side only (no SSR/backend need yet); revisit Next.js if/when accounts, persistence, or shared/public machine galleries are added.
- Diagram rendering: React Flow.
