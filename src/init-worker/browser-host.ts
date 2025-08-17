import { Host } from "../types";

export class BrowserHost implements Host {
  readonly postMessage: (message: any) => void;
  constructor() {
    if (!self) {
      throw new Error(
        "self is not available. This code must be run in a worker thread context."
      );
    }
    this.postMessage = self.postMessage;
  }

  set onmessage(callback: (event: { data: any }) => void) {
    self.onmessage = callback;
  }
}
