export const example3 = {
  tabName: "Example 3",
  title: "Escape-Aware",
  description:
    'A third state resolves whether a quote seen while quoted is a closing quote or the first half of an ' +
    'escaped "" pair, by looking at what comes next. Gets doubled-quote escaping right for the common case. ' +
    "The textbook remaining gap is streaming input split across chunk boundaries — this tool always runs " +
    "over one complete in-memory string, so that specific failure mode doesn't apply here; try it against " +
    'the same input as Example 2 and compare.',
  source: `// Example 3: Quote-Aware With Escape Handling
// Three states. The new "quoteSeenInQuoted" state is reached after a quote is
// seen while inside a quoted field, and resolves what it means by looking at
// the very next character: another quote means it was an escaped, literal "
// (append it and stay quoted); anything else means that quote really was the
// closing quote.
// Good at: quoted fields with embedded commas/newlines AND escaped quotes,
// single-pass, in memory — this is the first version that gets "" right.
// The textbook remaining gap for a version like this is a *streaming* parser
// having to peek at the next character right when a chunk boundary falls
// between the two quotes of an escaped pair. This tool always simulates over
// one complete in-memory string (never chunks), so that specific bug doesn't
// have anywhere to manifest here — every input below is handled correctly.

type State = "unquoted" | "quoted" | "quoteSeenInQuoted";

const labels: Record<State, string> = {
  unquoted: "Unquoted",
  quoted: "Quoted",
  quoteSeenInQuoted: "Quote Seen in Quoted Field",
};

const startState: State = "unquoted";

const vars: { field: string; row: string[]; rows: string[][] } = {
  field: "",
  row: [],
  rows: [],
};

function step(state: State, char: string | null): State {
  switch (state) {
    case "unquoted":
      if (char === '"') {
        return "quoted";
      }
      if (char === ",") {
        vars.row.push(vars.field);
        vars.field = "";
        return "unquoted";
      }
      if (char === "\\n") {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "unquoted";
      }
      if (char === null) {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "unquoted";
      }
      vars.field += char;
      return "unquoted";

    case "quoted":
      if (char === '"') {
        return "quoteSeenInQuoted";
      }
      if (char === null) {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "unquoted";
      }
      vars.field += char;
      return "quoted";

    case "quoteSeenInQuoted":
      if (char === '"') {
        // Second quote of an escaped "" pair: it's a literal quote character.
        vars.field += char;
        return "quoted";
      }
      if (char === ",") {
        // Not a second quote, so the first one really did close the field.
        vars.row.push(vars.field);
        vars.field = "";
        return "unquoted";
      }
      if (char === "\\n") {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "unquoted";
      }
      if (char === null) {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "unquoted";
      }
      vars.field += char;
      return "unquoted";
  }
}
`,
};
