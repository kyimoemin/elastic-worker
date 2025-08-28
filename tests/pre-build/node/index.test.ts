import { describe, expect, it, afterAll } from "vitest";
import { Host, UniversalWorker, getUUID } from "../../../src/browser/index";
import nodeCrypto from "crypto";

const originalCrypto = globalThis.crypto;
globalThis.crypto = nodeCrypto as any;

afterAll(() => {
  globalThis.crypto = originalCrypto;
});

describe("Necessary modules should be exported", () => {
  it("should be exported", () => {
    expect(Host).toBeDefined();
  });
  it("should be exported", () => {
    expect(UniversalWorker).toBeDefined();
  });
  it("should be exported", () => {
    expect(getUUID).toBeDefined();
  });
});

describe("getUUID", () => {
  it("should return a valid UUID", () => {
    const uuid = getUUID();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(uuid)).toBe(true);
  });
});
