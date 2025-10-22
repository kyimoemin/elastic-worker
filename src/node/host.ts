import { HostInterface, UniversalTransferable } from "../types";
import { parentPort, isMainThread } from "worker_threads";
export class Host implements HostInterface {
  readonly postMessage: (
    message: any,
    transferList?: UniversalTransferable[]
  ) => void;
  private readonly parentPort;
  constructor() {
    if (isMainThread)
      throw new Error(
        "You are trying to run the code in the main thread. This code must be run in a worker thread context."
      );
    if (!parentPort)
      throw new Error(
        "`parentPort` is not available. This code must be run in a worker thread context."
      );

    this.parentPort = parentPort;
    this.postMessage = (data, transferList) =>
      parentPort?.postMessage(data, transferList);
  }

  set onmessage(callback: (data: any) => void) {
    this.parentPort.on("message", callback);
  }
}
