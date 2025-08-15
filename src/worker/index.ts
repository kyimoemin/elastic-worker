import { isBrowser, isNode } from "../constants";
import { UniversalWorker } from "../types";
import { BrowserWorker } from "./browser-worker";
import { NodeWorker } from "./node-worker";

/**
 * Creates a worker for the current environment.
 * @param workerURL The URL of the worker script.
 * @returns
 */
export function getUniversalWorker(workerURL: URL): UniversalWorker {
  if (isBrowser()) {
    return new BrowserWorker(workerURL);
  } else if (isNode()) {
    return new NodeWorker(workerURL);
  } else {
    throw new Error(
      "async-multi-worker only supports browser and Node.js environments."
    );
  }
}
