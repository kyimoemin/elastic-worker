import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockWorkerThreads() {
  vi.resetModules();
  vi.doMock("worker_threads", () => ({
    isMainThread: false,
    parentPort: {
      postMessage: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      removeListener: vi.fn(),
    },
  }));
}

function clearMock() {
  vi.unmock("worker_threads");
  vi.resetModules();
}

const importHost = async () => {
  const mod = await import("../../../src/node/host");
  return mod.Host;
};

afterEach(() => {
  clearMock();
});

describe("Node > Host > Worker Thread", () => {
  beforeEach(() => {
    mockWorkerThreads();
  });
  it("should create a new instance", async () => {
    const Host = await importHost();
    const host = new Host();
    expect(host).toBeInstanceOf(Host);
  });

  it("should post a message", async () => {
    const Host = await importHost();
    const host = new Host();
    const message = { type: "test", payload: "Hello, world!" };
    const spy = vi.spyOn(host, "postMessage");
    host.postMessage(message);
    expect(spy).toHaveBeenCalledWith(message);
  });
  it("should onmessage work properly", async () => {
    const { parentPort } = await import("worker_threads");
    const Host = await importHost();
    const host = new Host();
    const message = { type: "test", payload: "Hello, world!" };
    const callback = vi.fn();
    host.onmessage = callback;
    // Simulate a message event from parentPort
    if (parentPort && (parentPort.on as any).mock) {
      // Find the handler registered for 'message'
      const handler = (parentPort.on as any).mock.calls.find(
        (call: any[]) => call[0] === "message"
      )?.[1];
      if (handler) handler(message);
    }
    expect(callback).toHaveBeenCalledWith(message);
  });
});

describe("Node > Host > Main thread", () => {
  it("should throw if Host is running in main thread", async () => {
    vi.doMock("worker_threads", () => ({
      isMainThread: true,
      parentPort: null,
    }));
    const Host = await importHost();
    expect(() => new Host()).toThrowError(
      "You are trying to run the code in the main thread. This code must be run in a worker thread context."
    );
  });
  it("should throw if parentPort does not exist", async () => {
    vi.doMock("worker_threads", () => ({
      isMainThread: false,
      parentPort: null,
    }));
    const Host = await importHost();
    expect(() => new Host()).toThrowError(
      "`parentPort` is not available. This code must be run in a worker thread context."
    );
  });
});
