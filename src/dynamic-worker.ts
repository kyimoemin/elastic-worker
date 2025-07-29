/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResponsePayload, WorkerObject, WorkerProxy } from "./types";
import { WorkerInfo, WorkerManager } from "./worker-manager";
import { randomUUID } from "node:crypto";

/**
 * A generic handler for making asynchronous function calls to a Web Worker.
 *
 * This class manages communication between the main thread and a worker, allowing you to call worker-exposed functions as Promises.
 * It handles message passing, result/error propagation, timeouts, and worker cleanup.
 *
 * @template T - The type describing the functions exposed by the worker (should extend WorkerObject).
 *
 * @see func for calling worker functions
 * @see terminate for cleanup
 */
export class DynamicWorker<T extends WorkerObject> implements WorkerProxy<T> {
  private workerManager: WorkerManager;

  constructor(workerURL: URL) {
    this.workerManager = new WorkerManager(workerURL);
  }

  private messageListener =
    ({
      workerInfo,
      resolve,
      reject,
      timeoutId,
    }: {
      workerInfo: WorkerInfo;
      resolve: (result: any) => any;
      reject: (error: Error) => any;
      timeoutId?: ReturnType<typeof setTimeout>;
    }) =>
    (event: MessageEvent<ResponsePayload<any>>) => {
      const { result, error } = event.data as ResponsePayload<any>;
      if (error) {
        const e = new Error(error.message);
        if (error.name) e.name = error.name;
        if (error.stack) e.stack = error.stack;
        reject(e);
      } else {
        resolve(result);
      }
      workerInfo.busy = false;
      clearTimeout(timeoutId);
    };

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
        const id = randomUUID();

        const workerInfo = this.workerManager.getWorker();

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        if (timeoutMs && timeoutMs !== Infinity && timeoutMs > 0) {
          timeoutId = setTimeout(() => {
            reject(new Error(`Worker call timed out after ${timeoutMs}ms`));
            this.workerManager.terminateWorker(workerInfo.worker);
          }, timeoutMs);
        }

        workerInfo.worker.onmessage = this.messageListener({
          workerInfo,
          resolve,
          reject,
          timeoutId,
        });
        workerInfo.worker.onerror = reject;
        workerInfo.busy = true;
        workerInfo.worker.postMessage({ func: funcName, args, id });
      });
  };
  /**
   * Terminates the worker and cleans up all pending calls.
   * This method removes all event listeners and clears the calls map.
   * It should be called when the worker is no longer needed to prevent memory leaks.
   *
   * ! Keep in mind that this will stop all workers including the workers with ongoing calls.
   */
  terminate = () => {
    this.workerManager.terminateAllWorkers();
  };
}
