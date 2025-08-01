import { isBrowser } from "../constants";
import { UniversalWorker } from "../types";

export class BrowserWorker implements UniversalWorker {
  private worker: Worker;
  constructor(workerURL: URL) {
    if (!isBrowser) {
      throw new Error(
        "BrowserWorker can only be used in a browser environment."
      );
    }
    this.worker = new Worker(workerURL, { type: "module" });
  }

  postMessage(message: any): void {
    this.worker.postMessage(message);
  }

  set onmessage(handler: (message: any) => void) {
    this.worker.onmessage = (event) => handler(event.data);
  }

  set onerror(handler: (error: Error) => void) {
    this.worker.onerror = (event) => handler(event.error);
  }

  set onexit(handler: (exitCode: number) => void) {
    // Browser workers do not have an exit event like Node.js workers.
  }

  terminate(): void {
    this.worker.terminate();
  }
}
