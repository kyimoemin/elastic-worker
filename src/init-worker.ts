import { Host } from "#env-adapter";
import type { FunctionsRecord, RequestPayload, ResponsePayload } from "./types";

/**
 *
 * @param obj Object containing functions to be called in the worker.
 */
export const initWorker = <T extends FunctionsRecord>(obj: T) => {
  const host = new Host();
  host.onmessage = async (event) => {
    const { func, args, id } = event.data as RequestPayload<
      Parameters<T[keyof T]>
    >;
    try {
      if (typeof obj[func] !== "function") {
        throw new Error(`Function '${String(func)}' not found in worker.`);
      }
      const result = await obj[func](...args);
      host.postMessage({ id, result });
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
      host.postMessage(response);
    }
  };
};
