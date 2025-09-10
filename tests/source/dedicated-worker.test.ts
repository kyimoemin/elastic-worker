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
    try {
      const fail = dedicatedWorker.func("fail");
      await fail(1, 2);
    } catch (error) {
      expect(error.message).toBe("Function 'fail' not found in worker.");
    }
  });

  it("should report busy state", async () => {
    try {
      const add = dedicatedWorker.func("add");
      const promise = add(1, 2);
      expect(dedicatedWorker.busy).toBe(true);
      await promise;
    } catch (e) {
      console.log(e);
    }
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
      await dedicatedWorker.terminate();
      expect(dedicatedWorker.busy).toBe(false);
      await promise;
    } catch (e) {
      expect(e.message).toBe("Worker was terminated");
    }
  });

  it("should isTerminated to be true", async () => {
    //assume worker is terminated from previous test
    expect(dedicatedWorker.isTerminated).toBe(true);
  });

  it("should respawn worker", async () => {
    dedicatedWorker.respawn();
    expect(dedicatedWorker.isTerminated).toBe(false);
  });

  it("should report queueSize correctly", async () => {
    const add = dedicatedWorker.func("add");
    const sub = dedicatedWorker.func("subtract");
    const p1 = add(1, 2);
    const p2 = sub(3, 1);
    expect(dedicatedWorker.queueSize).toBe(2);
    await Promise.all([p1, p2]);
    expect(dedicatedWorker.queueSize).toBe(0);
  });

  it("should throw QueueOverflowError if maxQueueSize exceeded", async () => {
    const smallQueueWorker = new DedicatedWorker(workerURL, {
      maxQueueSize: 1,
    });
    const add = smallQueueWorker.func("add");
    add(1, 2); // fills the queue
    const sub = smallQueueWorker.func("subtract");
    await expect(sub(3, 1)).rejects.toThrow("Queue limit of 1 reached");
    smallQueueWorker.terminate();
  });

  it("should respawn worker on error and resolve new calls", async () => {
    // cannot simulate crash in test, coz all uncaught exceptions are caught in initWorker function
    const err = dedicatedWorker.func("error");
    try {
      await err(1, 2);
    } catch (e) {
      // error thrown, worker should respawn
    }
    // After error, new calls should still work
    const add = dedicatedWorker.func("add");
    const result = await add(2, 3);
    expect(result).toBe(5);
  });
});
