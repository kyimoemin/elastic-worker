import { UniversalWorker } from "#env-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerPool } from "../../src/utils/worker-pool";
import { sleep } from "../utils";

// Mock UniversalWorker for testing
vi.mock("#env-adapter", () => {
  return {
    UniversalWorker: vi.fn().mockImplementation(() => {
      return {
        terminate: vi.fn(),
      };
    }),
  };
});

describe("WorkerPool", () => {
  let workerURL: URL;
  let workerPool: WorkerPool;
  const minPoolSize = 1;
  const maxPoolSize = 2;
  beforeEach(() => {
    workerURL = new URL("./dummy-worker.js", import.meta.url);
    workerPool = new WorkerPool(workerURL, {
      minPoolSize,
      maxPoolSize,
      terminateIdleDelay: 1,
    });
  });
  it("should set terminateIdleDelay option", () => {
    expect(workerPool.terminateIdleDelay).toBe(1);
  });

  it("should set and clear timeoutId for idle workers if there are more than minWorkers", async () => {
    const worker = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    expect(worker).toBeDefined();
    expect(worker === worker2).toBeFalsy();
    // Mark worker as idle, should set timeoutId
    workerPool.releaseWorker(worker2!);
    workerPool.releaseWorker(worker!);
    const workerInfo = workerPool.pool.get(worker!);
    // workerInfo may be undefined if already terminated, so check if timeoutId is set or worker is removed
    if (workerInfo) {
      expect(workerInfo.timeoutId).not.toBeNull();
      // Wait for the delay to ensure termination
      await sleep(1);
      expect(workerPool.pool.get(worker!)).toBeUndefined();
    }
  });

  afterEach(() => {
    workerPool.terminateAllWorkers();
    vi.clearAllMocks();
  });

  it("should create a WorkerPool instance with correct pool sizes", () => {
    expect(workerPool).toBeInstanceOf(WorkerPool);
    expect(workerPool.minPoolSize).toBe(minPoolSize);
    expect(workerPool.maxPoolSize).toBe(maxPoolSize);
  });

  it("should initialize with minPoolSize workers", () => {
    // The pool should have minPoolSize workers after construction
    expect((UniversalWorker as any).mock.instances.length).toBe(minPoolSize);
  });

  it("should spawn and reuse workers", () => {
    const worker1 = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    expect(worker1).not.toBe(worker2);
    // Mark worker1 as idle, should be reused
    if (worker1) workerPool.releaseWorker(worker1);
    const worker3 = workerPool.getWorker();
    expect(worker3).toBe(worker1);
  });

  it("should not exceed maxPoolSize", async () => {
    const worker1 = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    const worker3 = workerPool.getWorker();
    expect(worker3).toBeUndefined(); // maxPoolSize reached
    expect(workerPool.pool.size).toBe(maxPoolSize);
    const workers = [
      workerPool.releaseWorker(worker1!),
      workerPool.releaseWorker(worker2!),
      workerPool.releaseWorker(worker3!),
    ];
    await Promise.all(workers);
  });
  it("should not exceed maxPoolSize for idle workers", async () => {
    const worker1 = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    const workers = [
      workerPool.releaseWorker(worker1!),
      workerPool.releaseWorker(worker2!),
    ];
    await Promise.all(workers);
    expect(workerPool.pool.size).toBe(2);
    await sleep(1);
    expect(workerPool.pool.size).toBe(1);
  });

  it("should terminate a specific worker", () => {
    const worker = workerPool.getWorker();
    if (worker) {
      workerPool.terminateWorker(worker);
      expect(worker.terminate).toHaveBeenCalled();
      const terminatedWorker = workerPool.pool.get(worker);
      expect(terminatedWorker).toBeUndefined();
    } else {
      throw new Error("getWorker() returned undefined");
    }
  });

  it("should terminate all workers", async () => {
    const worker1 = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    await workerPool.terminateAllWorkers();
    if (worker1) expect(worker1.terminate).toHaveBeenCalled();
    if (worker2) expect(worker2.terminate).toHaveBeenCalled();
    expect(workerPool.pool.size).toBe(0);
  });

  it("should handle idleWorker for unknown worker", () => {
    const fakeWorker = { terminate: vi.fn() };
    workerPool.releaseWorker(fakeWorker as any);
    expect(fakeWorker.terminate).toHaveBeenCalled();
  });
});
