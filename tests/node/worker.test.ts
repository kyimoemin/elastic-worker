import { describe, it, expect } from "vitest";
import { UniversalWorker } from "../../dist/node/node/universal-worker";
import { DedicatedWorker } from "../../dist/node/index";

describe("dist/worker/index.js", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const worker = new DedicatedWorker(workerURL);

  it("should be defined", () => {
    expect(UniversalWorker).toBeDefined();
  });

  it("should return a UniversalWorker instance for a valid worker URL", () => {
    // Use a dummy worker script path (must exist in dist for Node.js)
    // getWorker should not throw and should return an object with UniversalWorker methods
    const worker = new UniversalWorker(workerURL);
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe("function");
    expect(typeof worker.terminate).toBe("function");
  });
  it("should execute function correctly", async () => {
    const add = worker.func("add");
    const result = await add(1, 2);
    expect(result).toBe(3);
  });
});
