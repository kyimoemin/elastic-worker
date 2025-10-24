/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUUID } from "#env-adapter";
import {
  AbortedError,
  QueueOverflowError,
  TimeoutError,
  WorkerTerminatedError,
} from "./errors";
import type {
  FuncOptions,
  FunctionsRecord,
  PendingCall,
  ResponsePayload,
  UniversalWorkerInterface,
  WorkerProxy,
} from "./types";
import { combineSignals } from "./utils/abort-signal";
import { Queue } from "./utils/queue";
import { getReadonlyProxy } from "./utils/readonly-proxy";
import { convertToTransfer, Transfer } from "./utils/transfer";
import { WorkerPool } from "./utils/worker-pool";

type MessageListenerParam = {
  worker: UniversalWorkerInterface;
  resolve: (result: any) => any;
  reject: (error: Error) => any;
};

export type ElasticWorkerOptions = {
  minWorkers: number; // minimum number of workers to keep alive
  maxWorkers: number; // maximum number of worker allowed
  maxQueueSize?: number; // maximum number of tasks to queue
  terminateIdleDelay?: number; // time in ms to terminate idle workers above minWorkers
};

/**
 * A generic handler for making asynchronous function calls to a Worker.
 *
 * `ElasticWorker` manages communication between the main thread and a worker, allowing you to call worker-exposed functions as Promises.
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
  private readonly calls: Queue<PendingCall>;

  /**
   * > [!CAUTION]
   * > This property is for debugging purposes only. do not modify or use it to manage the queue.
   *
   * queue of pending calls (read-only)
   */
  readonly queue: Queue<PendingCall>;

  private readonly maxQueueSize: number;

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
   * @param {number} options.minWorkers Minimum number of idle workers to keep alive (default: 1)
   * @param {number} options.maxWorkers Maximum number of busy workers allowed. (default: 4)
   * @param {number} options.maxQueueSize Maximum number of tasks to queue (default: Infinity)
   * @param {number} options.terminateIdleDelay Delay in milliseconds before terminating an idle worker (default: 500ms)
   */
  constructor(
    workerURL: URL,
    {
      minWorkers = 1,
      maxWorkers = 4,
      maxQueueSize = Infinity,
      terminateIdleDelay = 500,
    }: Partial<ElasticWorkerOptions> = {}
  ) {
    this.workerPool = new WorkerPool(workerURL, {
      minPoolSize: minWorkers,
      maxPoolSize: maxWorkers,
      terminateIdleDelay,
    });
    this.maxQueueSize = maxQueueSize;
    this.calls = new Queue<PendingCall>(maxQueueSize);
    this.queue = getReadonlyProxy(this.calls);
  }

  private messageListener({ worker, resolve, reject }: MessageListenerParam) {
    return (data: ResponsePayload<any>) => {
      const { result, error } = data;
      if (error) {
        const e = new Error(error.message);
        if (error.name) e.name = error.name;
        if (error.stack) e.stack = error.stack;
        reject(e);
      } else {
        resolve(convertToTransfer(result) ?? result);
      }
      /**
       * todo :
       * check if there is any pending call in the queue,
       * if yes, pick the first one and execute it
       * else mark the worker as idle
       */
      return this.workerPool.releaseWorker(worker);
    };
  }

  private executeNextCall = () => {
    if (this.calls.size > 0) {
      const call = this.calls.dequeue();
      if (call) this.executeCall(call);
    }
  };

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
    (...args: Parameters<T[K]>) => {
      const signals = combineSignals({ signal, timeoutMs });
      return new Promise<ReturnType<T[K]>>((resolve, reject) => {
        this.executeCall({
          resolve,
          reject,
          func: funcName as string,
          args,
          signal: signals,
          id: getUUID(),
        });
      });
    };

  private executeCall = ({
    args,
    func,
    id,
    reject,
    resolve,
    signal,
  }: PendingCall) => {
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
          signal,
          id,
        });
    } else {
      const onAbort = (e: AbortSignalEventMap["abort"]) => {
        const target = e?.target as { reason?: { name: string } };
        if (target?.reason?.name === "TimeoutError")
          reject(new TimeoutError(func));
        else reject(new AbortedError(func));
        this.workerPool.terminateWorker(worker);
      };

      signal?.addEventListener("abort", onAbort, { once: true });

      worker.onmessage = async (message) => {
        signal?.removeEventListener("abort", onAbort);
        await this.messageListener({
          worker,
          resolve,
          reject,
        })(message);
        this.executeNextCall();
      };
      worker.onerror = async (error) => {
        reject(error);
        signal?.removeEventListener("abort", onAbort);
        //respawn worker if pool size is below minPoolSize
        if (this.workerPool.pool.size < this.workerPool.minPoolSize) {
          const worker = this.workerPool.getWorker();
          await this.workerPool.releaseWorker(worker!);
          this.executeNextCall();
        }
      };
      worker.onexit = () => reject(new WorkerTerminatedError());
      const isTransfer = args[0] instanceof Transfer;
      if (isTransfer && args.length > 1)
        throw new Error(
          "Transfer can only be used with single argument, please wrap your arguments in Transfer object."
        );
      worker.postMessage(
        { func, args, id },
        isTransfer ? (args[0] as Transfer<unknown>).transferList : undefined
      );
    }
  };
  /**
   * > [!CAUTION]
   * > Keep in mind that this will stop all workers including the workers with ongoing calls.
   *
   * Terminates the worker and cleans up all pending calls.
   * This method removes all event listeners and clears the calls queue.
   *
   */
  terminate = () => {
    for (const { reject } of this.calls.values()) {
      reject(new WorkerTerminatedError());
    }
    this.calls.clear();
    this.workerPool.terminateAllWorkers();
  };
}
