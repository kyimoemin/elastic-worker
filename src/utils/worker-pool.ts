import { UniversalWorker } from "#env-adapter";
import { getReadonlyProxy } from "./readonly-proxy";
import { UniversalWorkerInterface } from "../types";

export type WorkerPoolOptions = {
  minPoolSize: number;
  maxPoolSize: number;
  terminateIdleDelay?: number;
};

/**
 * Manages a pool of Workers, optimizing resource usage by limiting the number of non-busy workers.
 * Provides methods to spawn, reuse, terminate, and clean up workers.
 *
 * */
export class WorkerPool {
  public readonly minPoolSize: number;
  public readonly maxPoolSize: number;

  public readonly terminateIdleDelay: number;

  private workers: Map<UniversalWorkerInterface, WorkerInfo> = new Map();

  /**
   * > [!CAUTION]
   * > This property is for debugging purposes only. do not modify or use it to manage the pool.
   *
   * A read-only view of the current worker pool.
   */
  readonly pool = getReadonlyProxy<Map<UniversalWorkerInterface, WorkerInfo>>(
    this.workers
  );

  private readonly workerURL: URL;

  /**
   * Creates a WorkerPool instance.
   * @param workerURL URL of the worker script.
   * @param {object} options Configuration options for the worker pool.
   * @param {number} options.minPoolSize Minimum number of workers to keep alive
   * @param {number} options.maxPoolSize Maximum number of non-busy workers to keep alive
   * @param {number} options.terminateIdleDelay Delay in milliseconds before terminating an idle worker (default: 500ms)
   */
  constructor(
    workerURL: URL,
    { minPoolSize, maxPoolSize, terminateIdleDelay = 500 }: WorkerPoolOptions
  ) {
    this.workerURL = workerURL;
    this.minPoolSize = minPoolSize;
    this.maxPoolSize = maxPoolSize;
    this.terminateIdleDelay = terminateIdleDelay;
    this.spawnInitialWorkers();
  }

  private spawnInitialWorkers() {
    for (let i = 0; i < this.minPoolSize; i++) {
      this.spawnWorker();
    }
  }

  /**
   * Spawns a new Worker and adds it to the pool.
   * @returns The newly created WorkerInfo instance.
   */
  private spawnWorker() {
    const worker = new UniversalWorker(this.workerURL);
    worker.onerror = () => this.removeWorker(worker);
    worker.onexit = () => this.removeWorker(worker);
    const workerInfo = new WorkerInfo(worker);
    this.workers.set(worker, workerInfo);
    return workerInfo;
  }

  /**
   * Removes a Worker from the pool.
   *
   * @param worker The Worker instance to remove.
   */
  private removeWorker = (worker: UniversalWorkerInterface) => {
    const workerInfo = this.workers.get(worker);
    if (workerInfo) this.workers.delete(worker);
  };

  /**
   * Retrieves an available idle Worker from the pool,
   * or spawns a new one if none are available and the pool has not reached its maximum size.
   * @returns An available Worker instance. `undefined` if the pool has reached its maximum size and no workers are available.
   */
  getWorker = (): UniversalWorkerInterface | undefined => {
    for (const workerInfo of this.workers.values()) {
      if (!workerInfo.busy) {
        workerInfo.busy = true;
        return workerInfo.worker;
      }
    }
    if (this.workers.size >= this.maxPoolSize) return undefined;
    const workerInfo = this.spawnWorker();
    if (workerInfo.timeoutId) clearTimeout(workerInfo.timeoutId);
    workerInfo.busy = true;
    return workerInfo.worker;
  };

  /**
   * Terminates a specific Worker and removes it from the pool.
   * @param worker The Worker instance to terminate.
   */
  terminateWorker = (worker: UniversalWorkerInterface) => {
    this.removeWorker(worker);
    worker.terminate();
  };

  /**
   * Terminates a specific Worker and removes it from the pool when it is idle and existing workers exceed MAX_IDLE_WORKERS .
   * @param worker The Worker instance to terminate.
   */
  idleWorker = async (worker: UniversalWorkerInterface) => {
    if (!worker) return;
    const workerInfo = this.workers.get(worker);
    if (!workerInfo) return worker.terminate();

    let count = 0;
    for (const info of this.workers.values()) {
      if (!info.busy) count++;
      if (count >= this.minPoolSize) {
        workerInfo.timeoutId = setTimeout(() => {
          this.workers.delete(workerInfo.worker);
          workerInfo.worker.terminate();
        }, this.terminateIdleDelay);
        break;
      }
    }
    workerInfo.busy = false;
  };

  /**
   * Terminates all workers and clears the pool.
   *
   * ! be cautious when using this method, as it will stop all ongoing tasks.
   */
  terminateAllWorkers = async () => {
    const promises = [];
    for (const workerInfo of this.workers.values()) {
      promises.push(workerInfo.worker.terminate());
    }
    await Promise.all(promises);
    this.workers.clear();
  };
}

export class WorkerInfo {
  public readonly worker: UniversalWorkerInterface;

  busy: boolean;

  timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(worker: UniversalWorkerInterface) {
    this.worker = worker;
    this.busy = false;
  }
}
