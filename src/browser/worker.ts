import { UniversalWorkerInterface } from "../types";

export class UniversalWorker implements UniversalWorkerInterface {
  private worker: Worker;
  constructor(workerURL: URL) {
    this.worker = new window.Worker(workerURL, { type: "module" });
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
