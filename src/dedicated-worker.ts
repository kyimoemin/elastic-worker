/* eslint-disable @typescript-eslint/no-explicit-any */

import { ResponsePayload, FunctionsRecord, WorkerProxy } from "./types";
import { getUUID, UniversalWorker } from "#env-adapter";
import { QueueOverflowError, WorkerTerminatedError } from "./errors";
import { getReadonlyProxy } from "./utils/readonly-proxy";

type Calls = {
  resolve: (result?: any) => void;
  reject: (error: Error) => void;
  func: string;
};

export type DedicatedWorkerOptions = {
  maxQueueSize?: number;
};

/**
 * A generic handler for making asynchronous function calls to a Worker.
 *
 * This class manages communication between the main thread and a worker, allowing you to call worker-exposed functions as Promises.
 * It handles message passing, result/error propagation, timeouts, and worker cleanup.
 *
 * @template T - The type describing the functions exposed by the worker .
 *
 * @see func for calling worker functions
 * @see terminate for cleanup
 */
export class DedicatedWorker<T extends FunctionsRecord>
  implements WorkerProxy<T>
{
  private readonly calls = new Map<string, Calls>();
  /**
   * > [!CAUTION]
   * > This property is for debugging purposes only. do not modify or use it to manage the queue.
   *
   * queue of pending calls (read-only)
   */
  readonly queue = getReadonlyProxy(this.calls);
  private worker: UniversalWorker | null = null;

  readonly maxQueueSize: number;

  private readonly workerURL: URL;

  constructor(
    workerURL: URL,
    { maxQueueSize = Infinity }: DedicatedWorkerOptions = {}
  ) {
    this.workerURL = workerURL;
    this.maxQueueSize = maxQueueSize;
    this.spawnWorker();
  }

  private spawnWorker = () => {
    this.worker = new UniversalWorker(this.workerURL);
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
    this.worker.onerror = (error) => {
      this.cleanup(error);
      this.spawnWorker();
    };
    this.worker.onexit = () => {
      this.cleanup(new WorkerTerminatedError());
    };
  };

  private cleanup = (error: Error) => {
    for (const { reject } of this.calls.values()) {
      reject(error);
    }
    this.calls.clear();
    this.worker = null;
  };

  /**
   * Returns a function that calls a method in the worker asynchronously.
   *
   * @template K - The key of the function in the worker object.
   * @param funcName - The name of the function to call in the worker.
   * @returns A function that, when called with arguments, returns a Promise resolving to the result of the worker function.
   *
   * @example
   * const add = workerProxy.func('add');
   * const result = await add(1, 2);
   */
  func = <K extends keyof T>(funcName: K) => {
    return (...args: Parameters<T[K]>) =>
      new Promise<ReturnType<T[K]>>((resolve, reject) => {
        if (this.worker === null) return reject(new WorkerTerminatedError());
        if (this.calls.size >= this.maxQueueSize)
          return reject(new QueueOverflowError(this.maxQueueSize));
        const id = getUUID();
        this.calls.set(id, { resolve, reject, func: funcName as string });
        this.worker.postMessage({ func: funcName, args, id });
      });
  };

  get busy() {
    return this.calls.size > 0;
  }

  get isTerminated() {
    return this.worker === null;
  }

  /**
   * Terminates the worker and cleans up all pending calls.
   * This method removes all event listeners and clears the calls map.
   * It should be called when the worker is no longer needed to prevent memory leaks.
   */
  terminate = async () => {
    await this.worker?.terminate();
    this.cleanup(new WorkerTerminatedError());
  };
  /**
   * Respawns terminated worker.
   */
  respawn = () => {
    this.spawnWorker();
  };
}
