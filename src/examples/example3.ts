export const example3 = {
  tabName: "Example 3",
  source: `type State = "s1" | "s2" | "s3";

const startState: State = "s1";

const vars: { field: string; row: string[]; rows: string[][] } = {
  field: "",
  row: [],
  rows: [],
};

function step(state: State, char: string | null): State {
  switch (state) {
    case "s1":
      if (char === '"') {
        return "s2";
      }
      if (char === ",") {
        vars.row.push(vars.field);
        vars.field = "";
        return "s1";
      }
      if (char === "\\n") {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "s1";
      }
      if (char === null) {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "s1";
      }
      vars.field += char;
      return "s1";

    case "s2":
      if (char === '"') {
        return "s3";
      }
      if (char === null) {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "s1";
      }
      vars.field += char;
      return "s2";

    case "s3":
      if (char === '"') {
        vars.field += char;
        return "s2";
      }
      if (char === ",") {
        vars.row.push(vars.field);
        vars.field = "";
        return "s1";
      }
      if (char === "\\n") {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "s1";
      }
      if (char === null) {
        vars.row.push(vars.field);
        vars.field = "";
        vars.rows.push(vars.row);
        vars.row = [];
        return "s1";
      }
      vars.field += char;
      return "s1";
  }
}
`,
};
