export const tsStarterSource = `// Two states that just take turns "reading" each character.
type State = "stateA" | "stateB";

const labels: Record<State, string> = {
  stateA: "State A",
  stateB: "State B",
};

const startState: State = "stateA";

const vars = {
  log: "",
};

function step(state: State, char: string | null): State {
  switch (state) {
    case "stateA":
      if (char === null) {
        return "stateA";
      }
      vars.log += char;
      return "stateB";

    case "stateB":
      if (char === null) {
        return "stateB";
      }
      vars.log += char;
      return "stateA";
  }
}
`;
