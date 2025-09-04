import { describe, expect, it } from "vitest";
import {
  DedicatedWorker,
  ElasticWorker,
  TimeoutError,
  initWorker,
} from "../../src/index";

describe("index", () => {
  it("should export all necessary modules", () => {
    expect(DedicatedWorker).toBeDefined();
    expect(ElasticWorker).toBeDefined();
    expect(TimeoutError).toBeDefined();
    expect(initWorker).toBeDefined();
  });
});
