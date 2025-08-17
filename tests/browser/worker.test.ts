import { UniversalWorker } from "../../dist/browser/browser/universal-worker.js";
import { beforeAll, describe, expect, it } from "vitest";
import { mockBrowserWorker } from "./browser-worker-mock.js";

beforeAll(() => {
  mockBrowserWorker();
});

describe("dist/worker/index.js (browser)", () => {
  it("should be defined", () => {
    expect(UniversalWorker).toBeDefined();
  });

  it("should return a UniversalWorker instance for a valid worker URL", () => {
    // Use a dummy worker script path (must exist in dist for Node.js)
    const workerURL = new URL("./dummy-worker.js", import.meta.url);
    // getUniversalWorker should not throw and should return an object with UniversalWorker methods
    const worker = new UniversalWorker(workerURL);
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe("function");
    expect(typeof worker.terminate).toBe("function");
  });
});
