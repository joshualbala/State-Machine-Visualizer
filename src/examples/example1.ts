export const example1 = {
  tabName: "Example 1",
  title: "The Naive Splitter",
  description:
    "One state, no awareness of quotes at all: comma always ends a field, newline always ends a row. " +
    'Good for plain CSVs; try an input like "Smith, John",30 to see it wrongly split on the comma inside the name.',
  source: `// Example 1: The Naive Splitter
// One state. Splits on every comma and newline, with zero awareness of quotes.
// Good at: simple, well-formed CSVs with no commas or newlines inside values.
// Still broken: a value like "Smith, John" gets split into two fields — the
// internal comma looks exactly like a field boundary to this machine.

type State = "reading";

const labels: Record<State, string> = {
  reading: "Reading",
};

const startState: State = "reading";

const vars: { field: string; row: string[]; rows: string[][] } = {
  field: "",
  row: [],
  rows: [],
};

function step(state: State, char: string | null): State {
  switch (state) {
    case "reading":
      if (char === ",") {
        vars.row.push(vars.field);
        vars.field = "";
        return "reading";
      }
      if (char === "\\n") {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "reading";
      }
      if (char === null) {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "reading";
      }
      vars.field += char;
      return "reading";
  }
}
`,
};
