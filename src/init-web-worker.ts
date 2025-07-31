import { isBrowser } from "./constants";
import type { RequestPayload, ResponsePayload, FunctionsRecord } from "./types";

/**
 *
 * @param obj Object containing functions to be called in the worker.
 */
export const initWebWorker = <T extends FunctionsRecord>(obj: T) => {
  if (!isBrowser)
    throw new Error(
      "Unsupported environment: `initWebWorker` can only be used in browser environments. if you want to use it in Node.js, please use `initNodeWorker` instead."
    );
  self.onmessage = async (event) => {
    const { func, args, id } = event.data as RequestPayload<
      Parameters<T[keyof T]>
    >;
    try {
      if (typeof obj[func] !== "function") {
        throw new Error(`Function '${String(func)}' not found in worker.`);
      }
      const result = await obj[func](...args);
      self.postMessage({ id, result });
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
      self.postMessage(response);
    }
  };
  self.onclose = () => {
    self.postMessage({
      error: {
        message: "Worker has been closed.",
        name: "WorkerClosedError",
      },
    });
  };
};
