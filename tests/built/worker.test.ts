import { describe, it, expect } from "vitest";
import {
  DedicatedWorker,
  ElasticWorker,
  TimeoutError,
  registerWorker,
} from "elastic-worker";

// # Tests for build files

describe("registerWorker", () => {
  it("should be defined", () => {
    expect(registerWorker).toBeDefined();
  });
  it("should be a function with correct parameters", () => {
    expect(typeof registerWorker).toBe("function");
    expect(registerWorker.length).toBe(1);
  });
});

describe("TimeoutError", () => {
  it("should be defined", () => {
    expect(TimeoutError).toBeDefined();
  });
  it("should throw TimeoutError correctly", () => {
    const timeoutError = new TimeoutError("testFunction");
    expect(timeoutError).toBeInstanceOf(Error);
    expect(timeoutError.message).toBe("Worker call 'testFunction' timed out");
    expect(timeoutError.name).toBe("TimeoutError");
  });
});

describe("DedicatedWorker", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const dedicatedWorker = new DedicatedWorker(workerURL);
  it("should be defined", () => {
    expect(DedicatedWorker).toBeDefined();
  });
  it("should execute function correctly", async () => {
    const add = dedicatedWorker.func("add");
    const result = await add(1, 2);
    expect(result).toBe(3);
    dedicatedWorker.terminate();
  });
});

describe("ElasticWorker", () => {
  const workerURL = new URL("./dummy-worker.js", import.meta.url);
  const elasticWorker = new ElasticWorker(workerURL);
  it("should be defined", () => {
    expect(ElasticWorker).toBeDefined();
  });
  it("should execute function correctly", async () => {
    const add = elasticWorker.func("add");
    const result = await add(1, 2);
    expect(result).toBe(3);
    elasticWorker.terminate();
  });
});
