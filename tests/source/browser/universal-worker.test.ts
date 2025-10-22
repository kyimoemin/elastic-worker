import { UniversalWorker } from "../../../src/browser/universal-worker";
import { describe, expect, it, vi } from "vitest";

class MockWorker {
  onmessage = null;
  onerror = null;
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
}
var window = {
  Worker: MockWorker,
};

globalThis.window = {
  Worker: MockWorker,
} as any;

describe("Browser > UniversalWorker", () => {
  const url = new URL("../dummy-worker.js", import.meta.url);
  const worker = new UniversalWorker(url);
  it("should be defined", () => {
    expect(UniversalWorker).toBeDefined();
  });

  it("should create an instance", () => {
    expect(worker).toBeInstanceOf(UniversalWorker);
  });
  it("should have necessary methods", () => {
    expect(worker.postMessage).toBeDefined();
    expect(worker.terminate).toBeDefined();
  });

  it("should call postMessage with transferList", () => {
    const spy = vi.spyOn(worker["worker"], "postMessage");
    const message = { func: "foo", args: [], id: "1" };
    const transferList = [new ArrayBuffer(8)];
    worker.postMessage(message, transferList);
    expect(spy).toHaveBeenCalledWith(message, transferList);
  });
});
