import { describe, expect, it } from "vitest";
import { ElasticWorker } from "../../src/elastic-worker";
import { sleep } from "../utils";

describe("ElasticWorker", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const elasticWorker = new ElasticWorker(workerURL);

  it("should be defined", () => {
    expect(ElasticWorker).toBeDefined();
  });

  it("should have created instance", () => {
    expect(elasticWorker).toBeInstanceOf(ElasticWorker);
  });

  it("should call worker and resolve result", async () => {
    const add = elasticWorker.func("add");
    const result = await add(1, 2);
    expect(result).toBe(3);
  });

  it("should call worker and reject on error", async () => {
    const fail = elasticWorker.func("fail");
    const promise = fail(1, 2);
    expect(promise).rejects.toThrow("Function 'fail' not found in worker.");
  });

  it("should timeout if task takes too long", async () => {
    const slow = elasticWorker.func("fibonacci", 1);

    await expect(slow(33)).rejects.toThrowError(
      "Worker call timed out after 1ms"
    );
  });

  it("should reject on error", async () => {
    const err = elasticWorker.func("error");
    try {
      await err(1, 3);
    } catch (e) {
      expect((e as Error).message).toBe("fail");
    }
  });

  it("should clean up calls and reject all on terminated", async () => {
    try {
      const fibonacci = elasticWorker.func("fibonacci");
      const promise = fibonacci(22);
      elasticWorker.terminate();
      await promise;
    } catch (e) {
      expect(e.message).toBe("Worker was terminated");
    }
  });
});
