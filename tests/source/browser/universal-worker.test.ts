import { UniversalWorker } from "../../../src/browser/universal-worker";
import { describe, expect, it } from "vitest";

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
});
