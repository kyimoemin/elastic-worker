import { describe, it, expect } from "vitest";
import { UniversalWorker } from "../../dist/node/node/universal-worker";
import { DedicatedWorker, ElasticWorker } from "../../dist/node/index";

describe("UniversalWorker", () => {
  it("should be defined", () => {
    expect(UniversalWorker).toBeDefined();
  });

  it("should return a UniversalWorker instance for a valid worker URL", () => {
    // Use a dummy worker script path (must exist in dist for Node.js)
    // getWorker should not throw and should return an object with UniversalWorker methods
    const worker = new UniversalWorker("./dummy-worker.js");
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe("function");
    expect(typeof worker.terminate).toBe("function");
    worker.terminate();
  });
});

describe("DedicatedWorker", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const dedicatedWorker = new DedicatedWorker(workerURL);
  it("should be defined", () => {
    expect(DedicatedWorker).toBeDefined();
  });
  it("should execute function correctly", async () => {
    const add = dedicatedWorker.func("add");
    const result = await add(1, 2);
    expect(result).toBe(3);
    dedicatedWorker.terminate();
  });
});

describe("ElasticWorker", () => {
  console.log("meta url", import.meta.url);
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const elasticWorker = new ElasticWorker(workerURL);
  it("should be defined", () => {
    expect(ElasticWorker).toBeDefined();
  });
  it("should execute function correctly", async () => {
    const add = elasticWorker.func("add");
    const result = await add(1, 2);
    expect(result).toBe(3);
    elasticWorker.terminate();
  });
});
