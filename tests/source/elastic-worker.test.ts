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
    await expect(promise).rejects.toThrow(
      "Function 'fail' not found in worker."
    );
  });

  it("should timeout if task takes too long", async () => {
    const slow = elasticWorker.func("fibonacci", { timeoutMs: 1 });

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

  it("should throw QueueOverflowError when exceeding maxQueueSize", async () => {
    const smallQueueWorker = new ElasticWorker(workerURL, {
      maxQueueSize: 2,
      maxWorkers: 1,
    });
    const add = smallQueueWorker.func("add");
    // Make the worker busy so queue fills up
    const p1 = add(1, 2); // executes immediately
    const p2 = add(2, 3); // queued
    await expect(
      Promise.all([
        add(3, 4), // queued
        add(4, 5), // should throw QueueOverflowError
      ])
    ).rejects.toThrow("Queue limit of 2 reached");
    await Promise.allSettled([p1, p2]);
    smallQueueWorker.terminate();
  });

  it("should respect minWorkers and maxWorkers options", async () => {
    const poolWorker = new ElasticWorker(workerURL, {
      minWorkers: 2,
      maxWorkers: 2,
    });
    expect(poolWorker.pool.size).toBe(2);
    poolWorker.terminate();
  });

  it("should expose read-only queue and pool proxies", () => {
    // queue
    expect(() => {
      // @ts-expect-error
      elasticWorker.queue.set(0, {});
    }).toThrow("This Map is read-only (proxy blocked).");
    expect(() => {
      elasticWorker.queue.clear();
    }).toThrow("This Map is read-only (proxy blocked).");
    // pool
    expect(() => {
      // @ts-expect-error
      elasticWorker.pool.set({}, {});
    }).toThrow("This Map is read-only (proxy blocked).");
    expect(() => {
      elasticWorker.pool.clear();
    }).toThrow("This Map is read-only (proxy blocked).");
  });
});
