import { RequestPayload, UniversalWorkerInterface } from "../types";

export class UniversalWorker implements UniversalWorkerInterface {
  private worker: Worker;
  constructor(workerURL: URL) {
    this.worker = new window.Worker(workerURL, { type: "module" });
  }

  postMessage(
    message: RequestPayload<any>,
    transferList?: Transferable[]
  ): void {
    if (transferList) {
      this.worker.postMessage(message, transferList);
    } else {
      this.worker.postMessage(message);
    }
  }

  set onmessage(handler: UniversalWorkerInterface["onmessage"]) {
    this.worker.onmessage = (event) => handler(event.data);
    this.worker.onmessageerror = (event) =>
      handler({ error: event.data as Error, id: event.data?.id });
  }

  set onerror(handler: UniversalWorkerInterface["onerror"]) {
    this.worker.onerror = (event) => handler(event.error);
  }

  set onexit(handler: UniversalWorkerInterface["onexit"]) {
    // Browser workers do not have an exit event like Node.js workers.
  }

  async terminate(): Promise<void> {
    return this.worker.terminate();
  }
}
