import { Worker } from "worker_threads";
import { UniversalWorkerInterface } from "../types";

export class UniversalWorker implements UniversalWorkerInterface {
  private worker: Worker;

  constructor(workerURL: URL) {
    this.worker = new Worker(workerURL);
  }

  postMessage(message: any): void {
    this.worker.postMessage(message);
  }

  set onmessage(handler: (message: any) => void) {
    this.worker.on("message", handler);
  }

  set onerror(handler: (error: Error) => void) {
    this.worker.on("error", handler);
  }

  set onexit(handler: (exitCode: number) => void) {
    this.worker.on("exit", handler);
  }

  terminate(): void {
    this.worker.terminate();
  }
}
