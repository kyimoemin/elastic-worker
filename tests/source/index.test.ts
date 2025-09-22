import { describe, expect, it } from "vitest";
import {
  DedicatedWorker,
  ElasticWorker,
  TimeoutError,
  registerWorker,
} from "../../src/index";

describe("index", () => {
  it("should export all necessary modules", () => {
    expect(DedicatedWorker).toBeDefined();
    expect(ElasticWorker).toBeDefined();
    expect(TimeoutError).toBeDefined();
    expect(registerWorker).toBeDefined();
  });
});
