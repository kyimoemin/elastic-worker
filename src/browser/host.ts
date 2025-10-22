import { HostInterface, UniversalTransferable } from "../types";

export class Host implements HostInterface {
  readonly postMessage: (
    message: any,
    transferList?: UniversalTransferable[]
  ) => void;
  constructor() {
    if (!self) {
      throw new Error(
        "`self` is not available. Make sure you are running on browser environment."
      );
    }
    this.postMessage = (data, transferList) =>
      self.postMessage(data, { transfer: transferList });
  }

  set onmessage(callback: (data: any) => void) {
    self.onmessage = (event) => callback(event.data);
  }
}
