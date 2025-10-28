import { describe, it, expect } from "vitest";
import { combineSignals } from "../../src/utils/abort-signal";
import { sleep } from "../utils";

function createAbortSignal() {
  const controller = new AbortController();
  return { signal: controller.signal, controller };
}

describe("combineSignals", () => {
  it("returns undefined if no signal and timeoutMs is Infinity", () => {
    expect(() => combineSignals({ timeoutMs: Infinity })).toThrowError(
      "Invalid timeoutMs: Infinity. Non-positive or Infinity values are not allowed. Please use a positive number."
    );
  });

  it("throws error for invalid timeoutMs", () => {
    expect(() => combineSignals({ timeoutMs: 0 })).toThrow();
    expect(() => combineSignals({ timeoutMs: -1 })).toThrow();
  });

  it("returns a combined signal if signal is provided", () => {
    const { signal } = createAbortSignal();
    const combined = combineSignals({ signal, timeoutMs: 100 });
    expect(combined).toBeInstanceOf(AbortSignal);
  });

  it("returns a combined signal if timeoutMs is set", () => {
    const combined = combineSignals({ timeoutMs: 10 });
    expect(combined).toBeInstanceOf(AbortSignal);
  });

  it("aborts when timeoutMs is reached", async () => {
    const combined = combineSignals({ timeoutMs: 10 });
    expect(combined!.aborted).toBe(false);
    await sleep(11);
    expect(combined!.aborted).toBe(true);
  });

  it("aborts when original signal is aborted", async () => {
    const { signal, controller } = createAbortSignal();
    const combined = combineSignals({ signal, timeoutMs: 1000 });
    expect(combined!.aborted).toBe(false);
    controller.abort();
    expect(combined!.aborted).toBe(true);
  });
});
