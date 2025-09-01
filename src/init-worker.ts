import { Host } from "#env-adapter";
import type {
  FunctionsRecord,
  RequestPayload,
  ResponsePayload,
  HostInterface,
} from "./types";

/**
 *
 * @param obj Object containing functions to be called in the worker.
 * @returns The host instance for the worker. it was returns for testing purpose only
 *  do not use it in production code.
 */
export const initWorker = <T extends FunctionsRecord>(
  obj: T
): HostInterface => {
  const host = new Host();
  host.onmessage = async (data) => {
    const { func, args, id } = data as RequestPayload<Parameters<T[keyof T]>>;
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
  Object.freeze(host);
  return host;
};
