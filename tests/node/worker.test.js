import { describe, it, expect } from "vitest";
import { getWorker } from "../../dist/worker/index.js";

describe("dist/worker/index.js", () => {
  it("should be defined", () => {
    expect(getWorker).toBeDefined();
  });

  it("getWorker should return a UniversalWorker instance for a valid worker URL", () => {
    // Use a dummy worker script path (must exist in dist for Node.js)
    const workerURL = new URL("./dummy-worker.js", import.meta.url);
    // getWorker should not throw and should return an object with UniversalWorker methods
    const worker = getWorker(workerURL);
    expect(worker.constructor.name).toBe("NodeWorker");
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe("function");
    expect(typeof worker.terminate).toBe("function");
  });
});
