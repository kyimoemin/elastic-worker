import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
} from "vitest";
import { WorkerManager } from "../../src/worker-manager";
import { UniversalWorker } from "#env-adapter";

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

describe("WorkerManager", () => {
  let workerURL: URL;
  let manager: WorkerManager;
  beforeEach(() => {
    workerURL = new URL("./dummy-worker.js", import.meta.url);
    manager = new WorkerManager(workerURL, 2); // set max idle to 2 for easier testing
  });

  afterEach(() => {
    manager.terminateAllWorkers();
    vi.clearAllMocks();
  });

  it("should create a WorkerManager instance", () => {
    expect(manager).toBeInstanceOf(WorkerManager);
    expect(manager.MAX_IDLE_WORKERS).toBe(2);
  });

  it("should spawn and reuse workers", () => {
    const worker1 = manager.getWorker();
    const worker2 = manager.getWorker();
    expect(worker1).not.toBe(worker2);
    // Mark worker1 as idle, should be reused
    manager.idleWorker(worker1);
    const worker3 = manager.getWorker();
    expect(worker3).toBe(worker1);
  });

  it("should not exceed max idle workers", () => {
    const worker1 = manager.getWorker();
    const worker2 = manager.getWorker();
    const worker3 = manager.getWorker();
    manager.idleWorker(worker1);
    manager.idleWorker(worker2);
    manager.idleWorker(worker3); // triggers elimination
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
    const worker = manager.getWorker();
    manager.terminateWorker(worker);
    expect(worker.terminate).toHaveBeenCalled();
  });

  it("should terminate all workers", () => {
    const worker1 = manager.getWorker();
    const worker2 = manager.getWorker();
    manager.terminateAllWorkers();
    expect(worker1.terminate).toHaveBeenCalled();
    expect(worker2.terminate).toHaveBeenCalled();
  });

  it("should handle idleWorker for unknown worker", () => {
    const fakeWorker = { terminate: vi.fn() };
    manager.idleWorker(fakeWorker as any);
    expect(fakeWorker.terminate).toHaveBeenCalled();
  });
});
