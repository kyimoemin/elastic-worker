import { describe, expect, it } from "vitest";
import { DedicatedWorker } from "../../src/dedicated-worker";
import { sleep } from "../utils";

describe("DedicatedWorker", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const dedicatedWorker = new DedicatedWorker(workerURL);

  it("should be defined", () => {
    expect(DedicatedWorker).toBeDefined();
  });

  it("should have created instance", () => {
    expect(dedicatedWorker).toBeInstanceOf(DedicatedWorker);
  });

  it("should call worker and resolve result", async () => {
    const add = dedicatedWorker.func("add");
    const result = await add(1, 2);
    expect(result).toBe(3);
  });

  it("should call worker and reject on error", async () => {
    const fail = dedicatedWorker.func("fail");
    const promise = fail(1, 2);
    expect(promise).rejects.toThrow("Function 'fail' not found in worker.");
  });

  it("should report busy state", async () => {
    const add = dedicatedWorker.func("add");
    add(1, 2).then(async () => {
      await sleep(0);
      expect(dedicatedWorker.busy).toBe(false);
    });
    expect(dedicatedWorker.busy).toBe(true);
  });

  it("should reject on error", async () => {
    const err = dedicatedWorker.func("error");
    try {
      await err(1, 3);
    } catch (e) {
      expect((e as Error).message).toBe("fail");
    }
  });

  it("should clean up calls and reject all on terminated", async () => {
    try {
      const add = dedicatedWorker.func("add");
      const promise = add(1, 2);
      dedicatedWorker.terminate();
      expect(dedicatedWorker.busy).toBe(false);
      await promise;
    } catch (e) {
      expect(e.message).toBe("Worker was terminated");
    }
  });
});
