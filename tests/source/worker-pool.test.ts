import { UniversalWorker } from "#env-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerPool } from "../../src/utils/worker-pool";

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
  beforeEach(() => {
    workerURL = new URL("./dummy-worker.js", import.meta.url);
    workerPool = new WorkerPool(workerURL, 2); // set max idle to 2 for easier testing
  });

  afterEach(() => {
    workerPool.terminateAllWorkers();
    vi.clearAllMocks();
  });

  it("should create a WorkerPool instance", () => {
    expect(workerPool).toBeInstanceOf(WorkerPool);
    expect(workerPool.MAX_IDLE_WORKERS).toBe(2);
  });

  it("should spawn and reuse workers", () => {
    const worker1 = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    expect(worker1).not.toBe(worker2);
    // Mark worker1 as idle, should be reused
    workerPool.idleWorker(worker1);
    const worker3 = workerPool.getWorker();
    expect(worker3).toBe(worker1);
  });

  it("should not exceed max idle workers", () => {
    const worker1 = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    const worker3 = workerPool.getWorker();
    workerPool.idleWorker(worker1);
    workerPool.idleWorker(worker2);
    workerPool.idleWorker(worker3); // triggers elimination
    // Only 2 idle workers should remain
    // The third idle worker should be terminated
    expect(
      (UniversalWorker as any).mock.instances.length
    ).toBeGreaterThanOrEqual(3);
    // Check terminate called on at least one worker
    const terminated = (UniversalWorker as any).mock.results.filter(
      ({ value }: any) => value.terminate.mock.calls.length > 0
    );
    expect(terminated.length).toBeGreaterThanOrEqual(1);
  });

  it("should terminate a specific worker", () => {
    const worker = workerPool.getWorker();
    workerPool.terminateWorker(worker);
    expect(worker.terminate).toHaveBeenCalled();
  });

  it("should terminate all workers", () => {
    const worker1 = workerPool.getWorker();
    const worker2 = workerPool.getWorker();
    workerPool.terminateAllWorkers();
    expect(worker1.terminate).toHaveBeenCalled();
    expect(worker2.terminate).toHaveBeenCalled();
  });

  it("should handle idleWorker for unknown worker", () => {
    const fakeWorker = { terminate: vi.fn() };
    workerPool.idleWorker(fakeWorker as any);
    expect(fakeWorker.terminate).toHaveBeenCalled();
  });
});
