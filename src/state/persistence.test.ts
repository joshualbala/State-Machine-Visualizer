import { describe, it, expect, beforeEach } from "vitest";
import { loadPersistedState, savePersistedState, type PersistedState } from "./persistence";

// vitest's default environment here is plain Node, which has no localStorage — stand in a
// minimal in-memory implementation rather than pulling in jsdom for one test file.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
});

const SAMPLE: PersistedState = {
  version: 1,
  activeTabId: "builtin-0",
  tabs: [
    { id: "builtin-0", name: "Example 1", isCustom: false, tsSourceText: "type State = \"a\";", inputString: "hi" },
    { id: "custom-1", name: "My machine", isCustom: true, tsSourceText: "", inputString: "" },
  ],
};

describe("persistence", () => {
  it("round-trips a valid state", () => {
    savePersistedState(SAMPLE);
    expect(loadPersistedState()).toEqual(SAMPLE);
  });

  it("returns null when nothing has been saved", () => {
    expect(loadPersistedState()).toBeNull();
  });

  it("returns null for corrupted JSON instead of throwing", () => {
    localStorage.setItem("smv-tabs-v1", "{not json");
    expect(loadPersistedState()).toBeNull();
  });

  it("rejects a mismatched schema version", () => {
    localStorage.setItem("smv-tabs-v1", JSON.stringify({ ...SAMPLE, version: 2 }));
    expect(loadPersistedState()).toBeNull();
  });

  it("rejects an empty tabs array", () => {
    localStorage.setItem("smv-tabs-v1", JSON.stringify({ ...SAMPLE, tabs: [] }));
    expect(loadPersistedState()).toBeNull();
  });

  it("rejects a tab missing required fields", () => {
    const malformed = { ...SAMPLE, tabs: [{ id: "x", name: "y" }] };
    localStorage.setItem("smv-tabs-v1", JSON.stringify(malformed));
    expect(loadPersistedState()).toBeNull();
  });

  it("savePersistedState never throws even if localStorage.setItem does", () => {
    localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    expect(() => savePersistedState(SAMPLE)).not.toThrow();
  });
});
