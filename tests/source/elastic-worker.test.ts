import { describe, expect, it } from "vitest";
import { ElasticWorker } from "../../src/elastic-worker";
import { sleep } from "../utils";
import { Calculator } from "./type";

describe("ElasticWorker", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const elasticWorker = new ElasticWorker<Calculator>(workerURL);
  it("should abort a call using AbortSignal and cleanup worker from pool", async () => {
    const controller = new AbortController();
    const add = elasticWorker.func("add", { signal: controller.signal });
    const promise = add(1, 2);
    controller.abort();
    await expect(promise).rejects.toThrow("Worker call 'add' has been aborted");
    expect(elasticWorker.pool.size).toBe(0);
    // Wait a tick for workerPool respawn
    await sleep(50);
    expect(elasticWorker.pool.size).toBe(1);
  });

  it("should remove worker from pool after timeout", async () => {
    const slow = elasticWorker.func("fibonacci", { timeoutMs: 1 });
    const promise = slow(30);
    await expect(promise).rejects.toThrowError(
      "Worker call 'fibonacci' timed out"
    );
    expect(elasticWorker.pool.size).toBe(0);
    // Wait a tick for workerPool respawn
    await sleep(50);
    expect(elasticWorker.pool.size).toBe(1);
  });

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
    // @ts-ignore
    const fail = elasticWorker.func("fail");
    const promise = fail(1, 2);
    await expect(promise).rejects.toThrow(
      "Function 'fail' not found in worker."
    );
  });

  it("should timeout if task takes too long", async () => {
    const slow = elasticWorker.func("fibonacci", { timeoutMs: 1 });

    await expect(slow(33)).rejects.toThrowError(
      "Worker call 'fibonacci' timed out"
    );
  });

  it("should reject on error", async () => {
    const err = elasticWorker.func("error");
    await expect(err(1, 3)).rejects.toThrow("fail");
  });

  it("should clean up calls and reject all on terminated", async () => {
    const fibonacci = elasticWorker.func("fibonacci");
    const promise = fibonacci(22);
    elasticWorker.terminate();
    await expect(promise).rejects.toThrow("Worker has been terminated");
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

  it("should transfer ArrayBuffer using Transfer object", async () => {
    const Transfer = (await import("../../src/utils/transfer")).Transfer;
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) view[i] = i;
    const transfer = new Transfer(buffer, [buffer]);
    const transferFn = elasticWorker.func("transfer");
    expect(buffer.byteLength).toBe(8);
    const promise = transferFn(transfer);
    expect(buffer.byteLength).toBe(0);
    const result = await promise;
    expect(result).toBeInstanceOf(Transfer);
    expect(result.value).toBeInstanceOf(ArrayBuffer);
    expect(result.value.byteLength).toBe(8);
    const resultView = new Uint8Array(result.value);
    for (let i = 0; i < resultView.length; i++) {
      expect(resultView[i]).toBe(i);
    }
  });

  it("should expose read-only queue and pool proxies", () => {
    expect(elasticWorker.queue).toBeDefined();
    expect(elasticWorker.queue.size).toBeDefined();
    expect(elasticWorker.pool).toBeDefined();
    expect(elasticWorker.pool.size).toBeDefined();
    // queue
    expect(() => {
      // @ts-expect-error
      elasticWorker.queue.set(0, {});
    }).toThrow("This Queue is read-only (proxy blocked).");
    expect(() => {
      elasticWorker.queue.clear();
    }).toThrow("This Queue is read-only (proxy blocked).");
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
