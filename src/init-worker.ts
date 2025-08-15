import { isBrowser, isNode } from "./constants";
import type { RequestPayload, ResponsePayload, FunctionsRecord } from "./types";

/**
 *
 * @param obj Object containing functions to be called in the worker.
 */
export const initWorker = <T extends FunctionsRecord>(obj: T) => {
  const host = getHost();
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

function getHost() {
  if (isBrowser()) {
    return new WebHost();
  } else if (isNode()) {
    const { isMainThread } = require("worker_threads");
    if (isMainThread)
      throw new Error(
        "`initNodeWorker` should be called in a worker thread context not in the main thread."
      );
    return new NodeHost();
  }
  throw new Error(
    "Unsupported environment: `initWorker` can only be used in Node.js or browser environments."
  );
}

interface Host {
  postMessage: (message: any) => void;
  onmessage: (event: { data: any }) => void;
}

class NodeHost implements Host {
  readonly postMessage: (message: any) => void;
  private readonly parentPort = require("worker_threads").parentPort;
  constructor() {
    const { parentPort } = require("worker_threads");
    this.postMessage = parentPort?.postMessage;
  }

  set onmessage(callback: (event: { data: any }) => void) {
    this.parentPort.on("message", callback);
  }
}

class WebHost implements Host {
  readonly postMessage: (message: any) => void;
  constructor() {
    this.postMessage = self.postMessage;
  }

  set onmessage(callback: (event: { data: any }) => void) {
    self.onmessage = callback;
  }
}
