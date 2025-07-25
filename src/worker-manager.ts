/**
 * Manages a pool of Web Workers, optimizing resource usage by limiting the number of non-busy workers.
 * Provides methods to spawn, reuse, terminate, and clean up workers.
 *
 * ## Usage Example
 *
 * ```typescript
 * // 1. Instantiate the manager with the worker script URL
 * const manager = new WorkerManager(new URL('./worker.js', import.meta.url));
 *
 * // 2. Get an available worker (or spawn a new one)
 * const worker = manager.getWorker();
 *
 * // 3. Mark the worker busy/free as needed
 * // worker.busy = true; // when starting a task
 * // worker.busy = false; // when done
 *
 * // 4. Terminate a specific worker
 * manager.terminateWorker(worker);
 *
 * // 5. Cleanup all workers when done
 * manager.cleanup();
 * ```
 *
 */
export class WorkerManager {
  /**
   * Maximum number of non-busy workers to keep alive. default is 5.
   * This helps manage resource usage by limiting the number of idle workers.
   */
  public readonly MAX_NON_BUSY_WORKERS: number;

  private workers: Map<Worker, WorkerInfo> = new Map();

  private readonly workerURL: URL;

  /**
   * Creates a WorkerManager instance.
   * @param workerURL URL of the worker script.
   * @param maxNonBusyWorkers Maximum number of non-busy workers to keep alive (default: 5).
   */
  constructor(workerURL: URL, maxNonBusyWorkers: number = 5) {
    this.workerURL = workerURL;
    this.MAX_NON_BUSY_WORKERS = maxNonBusyWorkers;
  }

  /**
   * Spawns a new Worker and adds it to the pool.
   * @returns The newly created WorkerInfo instance.
   */
  private spawnWorker = () => {
    const worker = new Worker(this.workerURL, { type: "module" });
    const workerInfo = new WorkerInfo(worker);
    this.workers.set(worker, workerInfo);
    return workerInfo;
  };

  /**
   * Retrieves an available non-busy Worker from the pool, or spawns a new one if none are available.
   * Also removes excess non-busy workers.
   * @returns An available WorkerInfo instance.
   */
  getWorker = () => {
    this.removeNonBusyWorkers();
    for (const workerInfo of this.workers.values()) {
      if (!workerInfo.busy) return workerInfo;
    }
    return this.spawnWorker();
  };

  /**
   * Removes excess non-busy workers from the pool, keeping only up to MAX_NON_BUSY_WORKERS.
   */
  private removeNonBusyWorkers = () => {
    const nonBusyWorkers: WorkerInfo[] = [];
    for (const workerInfo of this.workers.values()) {
      if (!workerInfo.busy) nonBusyWorkers.push(workerInfo);
    }
    if (nonBusyWorkers.length <= this.MAX_NON_BUSY_WORKERS) return;
    const excessWorkers = nonBusyWorkers.slice(this.MAX_NON_BUSY_WORKERS);
    for (const workerInfo of excessWorkers) {
      workerInfo.worker.terminate();
      this.workers.delete(workerInfo.worker);
    }
  };

  /**
   * Terminates a specific Worker and removes it from the pool.
   * @param worker The Worker instance to terminate.
   */
  terminateWorker = (worker: Worker) => {
    const workerInfo = this.workers.get(worker);
    if (workerInfo) {
      workerInfo.worker.terminate();
      this.workers.delete(worker);
    }
  };

  /**
   * Terminates all workers and clears the pool.
   *
   * ! be cautious when using this method, as it will stop all ongoing tasks.
   */
  cleanup = () => {
    console.warn("Terminating and cleaning up all workers");
    for (const workerInfo of this.workers.values()) {
      workerInfo.worker.terminate();
    }
    this.workers.clear();
  };
}

export class WorkerInfo {
  public readonly worker: Worker;

  busy: boolean;

  constructor(worker: Worker) {
    this.worker = worker;
    this.busy = false;
  }
}
