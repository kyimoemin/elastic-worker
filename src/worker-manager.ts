import { UniversalWorker } from "#env-adapter";

/**
 * Manages a pool of Workers, optimizing resource usage by limiting the number of non-busy workers.
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
 * manager.terminateAllWorkers();
 * ```
 *
 */
export class WorkerManager {
  /**
   * Maximum number of non-busy workers to keep alive. default is 5.
   * This helps manage resource usage by limiting the number of idle workers.
   */
  public readonly MAX_IDLE_WORKERS: number;

  private workers: Map<UniversalWorker, WorkerInfo> = new Map();

  private readonly workerURL: URL;

  /**
   * Creates a WorkerManager instance.
   * @param workerURL URL of the worker script.
   * @param maxIdleWorkers Maximum number of non-busy workers to keep alive (default: 5).
   */
  constructor(workerURL: URL, maxIdleWorkers: number = 5) {
    this.workerURL = workerURL;
    this.MAX_IDLE_WORKERS = maxIdleWorkers;
  }

  /**
   * Spawns a new Worker and adds it to the pool.
   * @returns The newly created WorkerInfo instance.
   */
  private spawnWorker = () => {
    const worker = new UniversalWorker(this.workerURL);
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
    for (const workerInfo of this.workers.values()) {
      if (!workerInfo.busy) {
        workerInfo.busy = true;
        return workerInfo.worker;
      }
    }
    const workerInfo = this.spawnWorker();
    workerInfo.busy = true;
    return workerInfo.worker;
  };

  /**
   *
   * @deprecated invoke idleWorker when the process is done
   *
   * Removes excess idle workers from the pool, keeping only up to MAX_IDLE_WORKERS.
   */
  private removeIdleWorkers = () => {
    const idleWorkers: WorkerInfo[] = [];
    for (const workerInfo of this.workers.values()) {
      if (!workerInfo.busy) idleWorkers.push(workerInfo);
    }
    if (idleWorkers.length <= this.MAX_IDLE_WORKERS) return;
    const excessWorkers = idleWorkers.slice(this.MAX_IDLE_WORKERS);
    for (const workerInfo of excessWorkers) {
      this.workers.delete(workerInfo.worker);
      workerInfo.worker.terminate();
    }
  };

  /**
   * Terminates a specific Worker and removes it from the pool.
   * @param worker The Worker instance to terminate.
   */
  terminateWorker = (worker: UniversalWorker) => {
    const workerInfo = this.workers.get(worker);
    if (workerInfo) this.workers.delete(worker);
    worker.terminate();
  };

  /**
   * Terminates a specific Worker and removes it from the pool when it is idle and existing workers exceed MAX_IDLE_WORKERS .
   * @param worker The Worker instance to terminate.
   */
  idleWorker = (worker: UniversalWorker) => {
    const workerInfo = this.workers.get(worker);
    if (!workerInfo) return worker.terminate();
    workerInfo.busy = false;

    this.eliminateIfExceedingMaxIdleWorkers(workerInfo);
  };

  private eliminateIfExceedingMaxIdleWorkers = (workerInfo: WorkerInfo) => {
    let count = 0;
    for (const info of this.workers.values()) {
      if (!info.busy) count++;
      if (count > this.MAX_IDLE_WORKERS) {
        this.workers.delete(workerInfo.worker);
        workerInfo.worker.terminate();
      }
    }
  };

  /**
   * Terminates all workers and clears the pool.
   *
   * ! be cautious when using this method, as it will stop all ongoing tasks.
   */
  terminateAllWorkers = () => {
    for (const workerInfo of this.workers.values()) {
      workerInfo.worker.terminate();
    }
    this.workers.clear();
  };
}

export class WorkerInfo {
  public readonly worker: UniversalWorker;

  busy: boolean;

  constructor(worker: UniversalWorker) {
    this.worker = worker;
    this.busy = false;
  }
}
