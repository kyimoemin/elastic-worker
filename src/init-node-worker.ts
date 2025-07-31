import { isNode } from "./constants";
import { parentPort, isMainThread } from "worker_threads";
import type { RequestPayload, ResponsePayload, FunctionsRecord } from "./types";

export const initNodeWorker = <T extends FunctionsRecord>(obj: T) => {
  if (isMainThread)
    throw new Error(
      "`initNodeWorker` should be called in a worker thread context not in the main thread."
    );
  if (!isNode)
    throw new Error(
      "Unsupported environment: `initNodeWorker` can only be used in Node.js environments. If you want to use it in the browser, please use `initWebWorker` instead."
    );

  parentPort?.on("message", async (event) => {
    const { func, args, id } = event.data as RequestPayload<
      Parameters<T[keyof T]>
    >;
    try {
      if (typeof obj[func] !== "function") {
        throw new Error(`Function '${String(func)}' not found in worker.`);
      }
      const result = await obj[func](...args);
      parentPort?.postMessage({ id, result });
    } catch (error) {
      const err = error as Error;
      const response: ResponsePayload = {
        id,
        error: {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
        },
      };
      parentPort?.postMessage(response);
    }
  });
};
