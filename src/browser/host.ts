import { HostInterface } from "../types";

export class Host implements HostInterface {
  readonly postMessage: (message: any) => void;
  constructor() {
    if (!self) {
      throw new Error(
        "self is not available. This code must be run in a worker thread context."
      );
    }
    this.postMessage = (data) => self.postMessage(data);
  }

  set onmessage(callback: (data: any) => void) {
    self.onmessage = (event) => callback(event.data);
  }
}
