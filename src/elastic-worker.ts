/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUUID, UniversalWorker } from "#env-adapter";
import {
  QueueOverflowError,
  TimeoutError,
  WorkerTerminatedError,
} from "./errors";
import type {
  Calls,
  FuncOptions,
  FunctionsRecord,
  ResponsePayload,
  UniversalWorkerInterface,
  WorkerProxy,
} from "./types";
import { Queue } from "./utils/queue";
import { getReadonlyProxy } from "./utils/readonly-proxy";
import { WorkerPool } from "./utils/worker-pool";

type MessageListenerParam = {
  worker: UniversalWorkerInterface;
  resolve: (result: any) => any;
  reject: (error: Error) => any;
  timeoutId?: ReturnType<typeof setTimeout>;
};

export type ElasticWorkerOptions = {
  minWorkers: number; // minimum number of workers to keep alive
  maxWorkers: number; // maximum number of worker allowed
  maxQueueSize?: number; // maximum number of tasks to queue
};

export type CallQueue = Calls & {
  args: any[];
  timeoutMs: number;
  signal: AbortSignal | undefined;
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
  private readonly calls: Queue<CallQueue>;

  /**
   * > [!CAUTION]
   * > This property is for debugging purposes only. do not modify or use it to manage the queue.
   *
   * queue of pending calls (read-only)
   */
  readonly queue: Queue<CallQueue>;

  readonly maxQueueSize: number;

  /**
   * > [!CAUTION]
   * > This property is for debugging purposes only. do not modify or use it to manage the pool.
   *
   * A read-only view of the current worker pool.
   */
  get pool() {
    return this.workerPool.pool;
  }

  /**
   *
   * @param workerURL URL of the worker script
   * @param {object} options Configuration options for the worker pool
   * @param {number} options.minWorkers Minimum number of workers to keep alive (default: 1)
   * @param {number} options.maxWorkers Maximum number of non-busy workers to keep alive (default: 4)
   * @param {number} options.maxQueueSize Maximum number of tasks to queue (default: Infinity)
   */
  constructor(
    workerURL: URL,
    {
      minWorkers = 1,
      maxWorkers = 4,
      maxQueueSize = Infinity,
    }: Partial<ElasticWorkerOptions> = {}
  ) {
    this.workerPool = new WorkerPool(workerURL, {
      minPoolSize: minWorkers,
      maxPoolSize: maxWorkers,
    });
    this.maxQueueSize = maxQueueSize;
    this.calls = new Queue<CallQueue>(maxQueueSize);
    this.queue = getReadonlyProxy(this.calls);
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
      /**
       * todo :
       * check if there is any pending call in the queue,
       * if yes, pick the first one and execute it
       * else mark the worker as idle
       */
      this.workerPool.idleWorker(worker);
      if (this.calls.size > 0) {
        const call = this.calls.dequeue();
        if (call) this.executeCall(call);
      }
    };
  }

  /**
   * Returns a function that calls a method in the worker asynchronously with optional timeout.
   *
   * @template K - The key of the function in the worker object.
   * @param funcName - The name of the function to call in the worker.
   * @param {object} options - Optional configuration for the function call.
   * @param {number} options.timeoutMs - Optional timeout in milliseconds (default: 5000ms).
   * @param {AbortSignal} options.signal - Optional AbortSignal to cancel the request.
   * @returns A function that, when called with arguments, returns a Promise resolving to the result of the worker function.
   *
   * @example
   * const add = workerProxy.func('add');
   * const result = await add(1, 2);
   */
  func =
    <K extends keyof T>(
      funcName: K,
      { timeoutMs = 5000, signal }: FuncOptions = {}
    ) =>
    (...args: Parameters<T[K]>) =>
      new Promise<ReturnType<T[K]>>((resolve, reject) => {
        this.executeCall({
          resolve,
          reject,
          func: funcName as string,
          args,
          timeoutMs,
          signal,
          id: getUUID(),
        });
      });

  private executeCall = ({
    args,
    func,
    id,
    reject,
    resolve,
    signal,
    timeoutMs,
  }: CallQueue) => {
    const worker = this.workerPool.getWorker();

    /**
     * no worker available (all busy and reached maxWorkers)
     */
    if (!worker) {
      if (this.calls.size >= this.maxQueueSize) {
        return reject(new QueueOverflowError(this.maxQueueSize));
      } else
        this.calls.enqueue({
          resolve,
          reject,
          func,
          args,
          timeoutMs,
          signal,
          id,
        });
    } else {
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
      worker.onerror = (error) => reject(error);
      worker.onexit = () => reject(new WorkerTerminatedError());
      worker.postMessage({ func, args, id });
    }
  };
  /**
   * > [!CAUTION]
   * > Keep in mind that this will stop all workers including the workers with ongoing calls.
   *
   * Terminates the worker and cleans up all pending calls.
   * This method removes all event listeners and clears the calls map.
   * It should be called when the worker is no longer needed to prevent memory leaks.
   *
   */
  terminate = () => {
    this.workerPool.terminateAllWorkers();
  };
}
