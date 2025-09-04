import { describe, expect, it } from "vitest";
import { TimeoutError } from "../../src/errors";

describe("TimeoutError", () => {
  it("should create TimeoutError with correct message", () => {
    const error = new TimeoutError(2000);
    expect(error.message).toBe("Worker call timed out after 2000ms");
  });
});
