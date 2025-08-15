import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { getWorker } from "../../dist/worker/index.js";
import { isBrowser } from "../../dist/constants.js";
import { mockBrowserWorker } from "./browser-worker-mock.js";

beforeAll(() => {
  mockBrowserWorker();
});

describe("dist/worker/index.js (browser)", () => {
  it("should be defined", () => {
    expect(getWorker).toBeDefined();
  });

  it("should run in browser env", () => {
    expect(isBrowser()).toBeTruthy();
  });
  it("getWorker should return BrowserWorker", () => {
    const workerURL = new URL("./dummy-worker.js", import.meta.url);
    const worker = getWorker(workerURL);
    expect(worker.constructor.name).toBe("BrowserWorker");
  });
  it("getWorker should return a UniversalWorker instance for a valid worker URL", () => {
    // Use a dummy worker script path (must exist in dist for Node.js)
    const workerURL = new URL("./dummy-worker.js", import.meta.url);
    // getWorker should not throw and should return an object with UniversalWorker methods
    const worker = getWorker(workerURL);
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe("function");
    expect(typeof worker.terminate).toBe("function");
  });
});
