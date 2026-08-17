export const example2 = {
  tabName: "Example 2",
  title: "Quote-Aware, No Escaping",
  description:
    'Adds a "quoted" state that swallows commas and newlines as literal characters. ' +
    'Fixes the previous version\'s biggest gap, but a doubled quote ("") used to escape a literal ' +
    'quote inside a field silently loses the quote character — try "said ""hi""",5 and watch the quotes vanish.',
  source: `// Example 2: Quote-Aware, No Escape Handling
// Two states. Toggles into "quoted" on a leading ", and while quoted, ignores
// commas and newlines as delimiters — the main win over Example 1.
// Still broken: it has no way to tell an escaped quote ("" inside a quoted
// field, meaning a literal ") apart from the real closing quote. The moment
// it sees a " while quoted, it just toggles back — so a doubled quote toggles
// closed then immediately re-opens, and the quote characters themselves are
// never added to the field. The field's internal quote content is silently lost.

type State = "unquoted" | "quoted";

const labels: Record<State, string> = {
  unquoted: "Unquoted",
  quoted: "Quoted",
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
        // No lookahead: any quote here is assumed to close the field.
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
      return "quoted";
  }
}
`,
};
