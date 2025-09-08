/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUUID, UniversalWorker } from "#env-adapter";
import { TimeoutError } from "./errors";
import type { FunctionsRecord, ResponsePayload, WorkerProxy } from "./types";
import { WorkerPool } from "./utils/worker-pool";

type MessageListenerParam = {
  worker: UniversalWorker;
  resolve: (result: any) => any;
  reject: (error: Error) => any;
  timeoutId?: ReturnType<typeof setTimeout>;
};

/**
 * A generic handler for making asynchronous function calls to a Worker.
 *
 * This class manages communication between the main thread and a worker, allowing you to call worker-exposed functions as Promises.
 * It handles message passing, result/error propagation, timeouts, and worker cleanup.
 *
 * @template T - The type describing the functions exposed by the worker (should extend FunctionsRecord).
 *
 * @see func for calling worker functions
 * @see terminate for cleanup
 */
export class ElasticWorker<T extends FunctionsRecord>
  implements WorkerProxy<T>
{
  private readonly workerPool: WorkerPool;

  constructor(workerURL: URL, maxIdleWorkers?: number) {
    this.workerPool = new WorkerPool(workerURL, maxIdleWorkers);
  }

  private messageListener({
    worker,
    resolve,
    reject,
    timeoutId,
  }: MessageListenerParam) {
    return (data: ResponsePayload<any>) => {
      const { result, error } = data;
      if (error) {
        const e = new Error(error.message);
        if (error.name) e.name = error.name;
        if (error.stack) e.stack = error.stack;
        reject(e);
      } else {
        resolve(result);
      }
      clearTimeout(timeoutId);
      this.workerPool.idleWorker(worker);
    };
  }

  /**
   * Returns a function that calls a method in the worker asynchronously with optional timeout.
   *
   * @template K - The key of the function in the worker object.
   * @param funcName - The name of the function to call in the worker.
   * @param timeoutMs - Optional timeout in milliseconds (default: 5000ms).
   * @returns A function that, when called with arguments, returns a Promise resolving to the result of the worker function.
   *
   * @example
   * const add = workerProxy.func('add');
   * const result = await add(1, 2);
   */
  func = <K extends keyof T>(funcName: K, timeoutMs: number = 5000) => {
    return (...args: Parameters<T[K]>) =>
      new Promise<ReturnType<T[K]>>((resolve, reject) => {
        const id = getUUID();

        const worker = this.workerPool.getWorker();

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        if (timeoutMs && timeoutMs !== Infinity && timeoutMs > 0) {
          timeoutId = setTimeout(() => {
            reject(new TimeoutError(timeoutMs));
            this.workerPool.terminateWorker(worker);
          }, timeoutMs);
        }

        worker.onmessage = this.messageListener({
          worker,
          resolve,
          reject,
          timeoutId,
        });
        worker.onerror = this.onWorkerError({ reject, worker });
        worker.onexit = this.onWorkerExit(reject);
        worker.postMessage({ func: funcName, args, id });
      });
  };

  private onWorkerExit(reject: (error: Error) => void) {
    return () => {
      reject(new Error("Worker was terminated"));
    };
  }

  private onWorkerError({
    reject,
    worker,
  }: {
    reject: (error: Error) => void;
    worker: UniversalWorker;
  }) {
    return (error: Error) => {
      reject(error);
      this.workerPool.terminateWorker(worker);
    };
  }
  /**
   * Terminates the worker and cleans up all pending calls.
   * This method removes all event listeners and clears the calls map.
   * It should be called when the worker is no longer needed to prevent memory leaks.
   *
   * ! Keep in mind that this will stop all workers including the workers with ongoing calls.
   */
  terminate = () => {
    this.workerPool.terminateAllWorkers();
  };
}
