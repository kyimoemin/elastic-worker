import { Host } from "#env-adapter";
import { FunctionNotFoundError } from "./errors";
import type { FunctionsRecord, RequestPayload, ResponsePayload } from "./types";
import { convertToTransfer, Transfer } from "./utils/transfer";

/**
 *
 * @param obj Object containing functions to be called in the worker.
 */
export const registerWorker = <T extends FunctionsRecord>(obj: T) => {
  const host = new Host();
  host.onmessage = async (data) => {
    const { func, args, id } = data as RequestPayload<Parameters<T[keyof T]>>;
    try {
      if (typeof obj[func] !== "function") {
        throw new FunctionNotFoundError(String(func));
      }
      const transfer = convertToTransfer(args[0]);

      const result = transfer
        ? await obj[func](transfer)
        : await obj[func](...args);
      if (result instanceof Transfer)
        host.postMessage({ id, result }, result.transferList);
      else host.postMessage({ id, result });
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
