import { describe, expect, it } from "vitest";
import { DedicatedWorker } from "../../src/dedicated-worker";
import { Calculator } from "./type";

describe("DedicatedWorker", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const dedicatedWorker = new DedicatedWorker<Calculator>(workerURL);

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
    // @ts-ignore
    const fail = dedicatedWorker.func("fail");
    await expect(fail(1, 2)).rejects.toThrow(
      "Function 'fail' not found in worker."
    );
  });

  it("should report busy state", async () => {
    const add = dedicatedWorker.func("add");
    const promise = add(1, 2);
    expect(dedicatedWorker.busy).toBe(true);
    await promise;
  });

  it("should reject on error", async () => {
    const err = dedicatedWorker.func("error");
    await expect(err(1, 3)).rejects.toThrow("fail");
  });

  it("should clean up calls and reject all on terminated", async () => {
    const add = dedicatedWorker.func("add");
    const promise = add(1, 2);
    await expect(dedicatedWorker.terminate()).resolves.toBeUndefined();
    await expect(promise).rejects.toThrow("Worker has been terminated");
    expect(dedicatedWorker.busy).toBe(false);
    dedicatedWorker.respawn();
  });

  it("should isTerminated to be true", async () => {
    await dedicatedWorker.terminate();
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
    expect(dedicatedWorker.queue.size).toBe(1);
    await Promise.all([p1, p2]);
    expect(dedicatedWorker.queue.size).toBe(0);
    expect(dedicatedWorker.busy).toBe(false);
  });

  it("should throw QueueOverflowError if maxQueueSize exceeded", async () => {
    const smallQueueWorker = new DedicatedWorker<Calculator>(workerURL, {
      maxQueueSize: 1,
    });
    const add = smallQueueWorker.func("add");
    const promise = [add(1, 2), add(2, 3)]; // fills the queue
    const sub = smallQueueWorker.func("subtract");
    await expect(sub(3, 1)).rejects.toThrow("Queue limit of 1 reached");
    await expect(Promise.all(promise)).resolves.toEqual([3, 5]);
    smallQueueWorker.terminate();
  });

  it("should respawn worker on error and resolve new calls", async () => {
    // cannot simulate crash in test, coz all uncaught exceptions are caught in initWorker function
    const err = dedicatedWorker.func("error");
    await expect(err(1, 2)).rejects.toThrow("fail");
    // After error, new calls should still work
    const add = dedicatedWorker.func("add");
    const result = await add(2, 3);
    expect(result).toBe(5);
  });
});
