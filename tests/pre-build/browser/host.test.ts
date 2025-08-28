import { beforeEach, describe, expect, it, vi } from "vitest";
import { Host } from "../../../src/browser/host";
import { beforeAll, afterAll } from "vitest";

// Mock the global 'self' object for browser worker tests and add cleanup
let originalSelf: typeof globalThis.self | undefined;

beforeEach(() => {
  originalSelf = globalThis.self;

  globalThis.self = {
    postMessage: vi.fn(),
    onmessage: vi.fn(),
  } as any;
});

afterAll(() => {
  if (originalSelf === undefined) {
    // @ts-ignore
    delete globalThis.self;
  } else {
    // @ts-ignore
    globalThis.self = originalSelf;
  }
});

describe("Browser > Host", () => {
  it("should create a new instance", () => {
    const host = new Host();
    expect(host).toBeInstanceOf(Host);
  });
  it("should throw if there is no self", () => {
    globalThis.self = undefined as any;
    expect(() => new Host()).toThrowError(
      "`self` is not available. Make sure you are running on browser environment."
    );
  });
  it("should post a message", () => {
    const host = new Host();
    const message = { type: "test", payload: "Hello, world!" };
    const spy = vi.spyOn(host, "postMessage");
    host.postMessage(message);
    expect(spy).toHaveBeenCalledWith(message);
  });
  it("should onmessage work properly", () => {
    const host = new Host();
    const message = { type: "test", payload: "Hello, world!" };
    const callback = vi.fn();
    host.onmessage = callback;
    // Simulate a message event
    (globalThis.self.onmessage as (event: { data: any }) => void)({
      data: message,
    });
    expect(callback).toHaveBeenCalledWith(message);
  });
});
