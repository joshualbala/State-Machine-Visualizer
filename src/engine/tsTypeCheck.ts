import ts from "typescript";
import libEs5Source from "typescript/lib/lib.es5.d.ts?raw";

export interface TypeCheckError {
  message: string;
  line?: number;
}

const FILE_NAME = "machine.ts";
const LIB_NAME = "lib.d.ts";

// Parsed once at module load: this is the expensive part (a ~220KB declaration file), and it
// never changes, so every check afterwards only has to (re)parse the user's small source file.
const libSourceFile = ts.createSourceFile(LIB_NAME, libEs5Source, ts.ScriptTarget.ES2017, true, ts.ScriptKind.TS);

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2017,
  module: ts.ModuleKind.None,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  noLib: true,
  lib: [],
  types: [],
};

/**
 * Runs the real TypeScript compiler's syntax + type checker against the source — never executes
 * it, just asks "is this valid, type-safe TypeScript?" the same way an editor's red squiggles
 * would. This is independent of (and in addition to) tsCompiler.ts's own structural checks: this
 * catches things like a wrong-typed startState or a `return` of a state name that was never
 * declared, using TypeScript's own type checker rather than our hand-rolled grammar walk.
 */
export function typeCheckTypeScript(source: string): TypeCheckError[] {
  try {
    const sourceFile = ts.createSourceFile(FILE_NAME, source, ts.ScriptTarget.ES2017, true, ts.ScriptKind.TS);

    const host: ts.CompilerHost = {
      getSourceFile: (fileName) => {
        if (fileName === FILE_NAME) return sourceFile;
        if (fileName === LIB_NAME) return libSourceFile;
        return undefined;
      },
      getDefaultLibFileName: () => LIB_NAME,
      writeFile: () => {},
      getCurrentDirectory: () => "",
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      fileExists: (fileName) => fileName === FILE_NAME || fileName === LIB_NAME,
      readFile: (fileName) => (fileName === FILE_NAME ? source : fileName === LIB_NAME ? libEs5Source : undefined),
      directoryExists: () => true,
      getDirectories: () => [],
    };

    const program = ts.createProgram([FILE_NAME, LIB_NAME], compilerOptions, host);
    const diagnostics = [...program.getSyntacticDiagnostics(sourceFile), ...program.getSemanticDiagnostics(sourceFile)];

    return diagnostics.map((d) => {
      const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      const line = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : undefined;
      return { message, line };
    });
  } catch {
    // TypeScript's own parser can stack-overflow on pathologically deep/repetitive nesting
    // (thousands of unclosed braces/parens, etc.) — degrade to a normal error instead of crashing
    // the whole app.
    return [{ message: "The TypeScript checker couldn't process this source (it may be too deeply nested). Try simplifying it." }];
  }
}
