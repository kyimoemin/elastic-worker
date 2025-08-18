/* eslint-disable @typescript-eslint/no-explicit-any */

import { ResponsePayload, FunctionsRecord, WorkerProxy } from "./types";
import { getUUID, UniversalWorker } from "#env-adapter";

type Calls = {
  resolve: (result?: any) => void;
  reject: (error: Error) => void;
};

/**
 * A generic handler for making asynchronous function calls to a Web Worker.
 *
 * This class manages communication between the main thread and a worker, allowing you to call worker-exposed functions as Promises.
 * It handles message passing, result/error propagation, timeouts, and worker cleanup.
 *
 * @template T - The type describing the functions exposed by the worker (should extend FunctionsRecord).
 *
 * @see func for calling worker functions
 * @see terminate for cleanup
 */
export class DedicatedWorker<T extends FunctionsRecord>
  implements WorkerProxy<T>
{
  private calls = new Map<string, Calls>();
  private worker: UniversalWorker;

  private readonly workerURL: URL;

  constructor(workerURL: URL) {
    this.workerURL = workerURL;
    this.worker = this.spawnWorker();
    this.worker.onmessage = (data) => {
      const { id, result, error } = data as ResponsePayload<any>;
      const call = this.calls.get(id);
      if (!call) return;
      if (error) {
        const e = new Error(error.message);
        if (error.name) e.name = error.name;
        if (error.stack) e.stack = error.stack;
        call.reject(e);
      } else {
        call.resolve(result);
      }
      this.calls.delete(id);
    };
    this.worker.onerror = this.cleanup;
  }

  private spawnWorker = () => {
    return new UniversalWorker(this.workerURL);
  };

  private cleanup = (error?: Error) => {
    console.log("Cleaning up worker calls", error);
    for (const { reject } of this.calls.values()) {
      reject(error ?? new Error("Worker was terminated"));
    }
    this.calls.clear();
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
  func = <K extends keyof T>(funcName: K) => {
    return (...args: Parameters<T[K]>) =>
      new Promise<ReturnType<T[K]>>((resolve, reject) => {
        const id = getUUID();
        this.calls.set(id, { resolve, reject });
        this.worker.postMessage({ func: funcName, args, id });
      });
  };

  get busy() {
    return this.calls.size > 0;
  }

  /**
   * Terminates the worker and cleans up all pending calls.
   * This method removes all event listeners and clears the calls map.
   * It should be called when the worker is no longer needed to prevent memory leaks.
   */
  terminate = () => {
    this.cleanup();
    this.worker.terminate();
  };
}
