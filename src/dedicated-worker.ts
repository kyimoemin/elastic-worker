/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ResponsePayload,
  FunctionsRecord,
  WorkerProxy,
  PendingCall,
} from "./types";
import { getUUID, UniversalWorker } from "#env-adapter";
import { QueueOverflowError, WorkerTerminatedError } from "./errors";
import { Queue } from "./utils/queue";

export type DedicatedWorkerOptions = {
  maxQueueSize?: number;
};

/**
 * @deprecated This class will not be removed in the future versions,
 * but it's recommended to use `ElasticWorker` for better performance and scalability.
 * If you want to maintain state between calls, consider using `ElasticWorker` with a shared state management approach.
 *
 * A generic handler for making asynchronous function calls to a Worker.
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
  private readonly calls: Queue<PendingCall>;
  private call: PendingCall | null = null;

  get queue() {
    return this.calls as Pick<Queue<PendingCall>, "size">;
  }

  private worker: UniversalWorker | null = null;

  private readonly maxQueueSize: number;

  private readonly workerURL: URL;

  /**
   *
   * @param workerURL URL of the worker script.
   * @param {object} options Options for configuring the DedicatedWorker instance.
   * @param {number} options.maxQueueSize Maximum number of pending calls allowed in the queue. Default is Infinity.
   *
   * @example
   * const workerURL = new URL('./worker.js', import.meta.url);
   */
  constructor(
    workerURL: URL,
    { maxQueueSize = Infinity }: DedicatedWorkerOptions = {}
  ) {
    this.workerURL = workerURL;
    this.maxQueueSize = maxQueueSize;
    this.calls = new Queue<PendingCall>(this.maxQueueSize);
    this.spawnWorker();
  }

  private spawnWorker = () => {
    this.worker = new UniversalWorker(this.workerURL);
    this.worker.onmessage = (data) => {
      const { result, error } = data as ResponsePayload<any>;
      // no call here mean worker is terminated, so will not execute next call
      if (!this.call) return;
      if (error) this.call.reject(error);
      else this.call.resolve(result);

      this.call = null;
      this.executeNextCall();
    };
    this.worker.onerror = async (error) => {
      /**
       * worker crashed, reject all pending calls and set worker to null
       * worker has to be terminated to prevent state in worker become inconsistent
       */
      this.clearCalls(error);
      await this.worker?.terminate();
      this.worker = null;
    };
    this.worker.onexit = () => {
      this.call = null;
      this.worker = null;
    };
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
        this.calls.enqueue({
          resolve,
          reject,
          func: funcName as string,
          args,
          id,
        });
        if (this.call === null) this.executeNextCall();
      });
  };

  /**
   * Indicates whether the worker is currently processing a call.
   */
  get busy() {
    return !!this.call;
  }

  private executeNextCall = () => {
    if (this.call !== null)
      throw new Error(
        `Active call in progress func:${this.call.func} id:${this.call.id}`
      );
    this.call = this.calls.dequeue() || null;
    if (!this.call) return;
    if (!this.worker) return this.clearCalls();
    this.worker.postMessage({
      func: this.call.func,
      args: this.call.args,
      id: this.call.id,
    });
  };

  /**
   * Indicates whether the worker has been terminated. Worker can be respawned using the `respawn` method.
   */
  get isTerminated() {
    return this.worker === null;
  }

  // worker is terminated, so clear all pending calls
  private clearCalls = (error?: Error) => {
    this.call?.reject(error ?? new WorkerTerminatedError());

    for (const { reject } of this.calls.values()) {
      reject(error ?? new WorkerTerminatedError());
    }
    this.calls.clear();
    this.call = null;
  };

  /**
   * Terminates the worker and cleans up all pending calls.
   * This method removes all event listeners and clears the calls queue.
   * It should be called when the worker is no longer needed.
   */
  terminate = async () => {
    this.clearCalls();
    await this.worker?.terminate();
    this.worker = null;
  };
  /**
   * Respawns terminated worker.
   */
  respawn = () => {
    this.spawnWorker();
  };
}
