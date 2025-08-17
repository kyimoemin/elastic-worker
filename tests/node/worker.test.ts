import { describe, it, expect } from "vitest";
import { getUniversalWorker } from "../../dist/worker/index.js";
import { isNode } from "../../dist/constants.js";

describe("dist/worker/index.js", () => {
  it("should be defined", () => {
    expect(getUniversalWorker).toBeDefined();
  });

  it("should run in node env", () => {
    expect(isNode()).toBeTruthy();
  });

  it("getWorker should return NodeWorker", () => {
    const workerURL = new URL("./dummy-worker.js", import.meta.url);
    const worker = getUniversalWorker(workerURL);
    expect(worker.constructor.name).toBe("NodeWorker");
  });

  it("getWorker should return a UniversalWorker instance for a valid worker URL", () => {
    // Use a dummy worker script path (must exist in dist for Node.js)
    const workerURL = new URL("./dummy-worker.js", import.meta.url);
    // getWorker should not throw and should return an object with UniversalWorker methods
    const worker = getUniversalWorker(workerURL);
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe("function");
    expect(typeof worker.terminate).toBe("function");
  });
});
