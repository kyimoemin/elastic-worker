import { describe, expect, it } from "vitest";
import {
  ElasticWorker,
  TimeoutError,
  registerWorker,
  Transfer,
} from "../../src/index";

describe("index", () => {
  it("should export all necessary modules", () => {
    expect(ElasticWorker).toBeDefined();
    expect(TimeoutError).toBeDefined();
    expect(registerWorker).toBeDefined();
    expect(Transfer).toBeDefined();
  });
});
