import type { Worker } from "worker_threads";
import { isNode } from "../constants";
import { UniversalWorker } from "../types";

export class NodeWorker implements UniversalWorker {
  private worker: Worker;

  constructor(workerURL: URL) {
    if (!isNode()) {
      throw new Error("NodeWorker can only be used in a Node.js environment.");
    }
    const { Worker } = require("worker_threads");
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
