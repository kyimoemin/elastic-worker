import type { RequestPayload, ResponsePayload, WorkerObject } from "./types";

/**
 *
 * @param obj Object containing functions to be called in the worker.
 */
export const initWorker = <T extends WorkerObject>(obj: T) => {
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
