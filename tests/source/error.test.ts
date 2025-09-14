import { describe, expect, it } from "vitest";
import { TimeoutError } from "../../src/errors";

describe("TimeoutError", () => {
  it("should create TimeoutError with correct message", () => {
    const error = new TimeoutError("testFunction");
    expect(error.message).toBe("Worker call 'testFunction' timed out");
  });
});
