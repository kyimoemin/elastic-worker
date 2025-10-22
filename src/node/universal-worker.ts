import { Worker } from "worker_threads";
import {
  RequestPayload,
  UniversalTransferable,
  UniversalWorkerInterface,
} from "../types";

export class UniversalWorker implements UniversalWorkerInterface {
  private worker: Worker;

  constructor(workerURL: URL) {
    this.worker = new Worker(workerURL);
  }

  postMessage(
    message: RequestPayload<any>,
    transferList?: UniversalTransferable[]
  ): void {
    this.worker.postMessage(message, transferList);
  }

  set onmessage(handler: UniversalWorkerInterface["onmessage"]) {
    this.worker.removeAllListeners("message");
    this.worker.removeAllListeners("messageerror");
    this.worker.on("message", handler);
    this.worker.on("messageerror", (error) => handler({ error, id: "" }));
  }

  set onerror(handler: UniversalWorkerInterface["onerror"]) {
    this.worker.removeAllListeners("error");
    this.worker.on("error", handler);
  }

  set onexit(handler: UniversalWorkerInterface["onexit"]) {
    this.worker.removeAllListeners("exit");
    this.worker.on("exit", handler);
  }

  terminate(): Promise<number> {
    return this.worker.terminate();
  }
}
