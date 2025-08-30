import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
class MockHost {
  postMessage = vi.fn();
  onmessage = vi.fn();
  triggerMessage = (data: any) => {
    return this.onmessage(data);
  };
}

function mockWorkerThreads() {
  vi.resetModules();
  vi.doMock("worker_threads", () => ({
    isMainThread: false,
  }));
}
beforeEach(() => {
  mockWorkerThreads();
  vi.doMock("#env-adapter", () => {
    return {
      Host: MockHost,
    };
  });

  functions = {
    add: vi.fn((a, b) => a + b),
    fail: vi.fn(() => {
      throw new Error("fail");
    }),
  };
});

let functions;

async function importInitWorker() {
  return import("../../src/init-worker");
}

describe("initWorker", () => {
  afterEach(() => {
    vi.unmock("worker_threads");
    vi.unmock("#env-adapter");
    vi.resetModules();
  });

  it("should call the correct function and post result", async () => {
    const { initWorker } = await importInitWorker();
    const host = initWorker(functions) as unknown as MockHost;
    const payload = { func: "add", args: [2, 3], id: "1" };
    await host.triggerMessage(payload);
    expect(functions.add).toHaveBeenCalledWith(2, 3);
    expect(host.postMessage).toHaveBeenCalledWith({
      id: "1",
      result: 5,
    });
  });

  it("should post error if function throws", async () => {
    const { initWorker } = await importInitWorker();
    const host = initWorker(functions) as unknown as MockHost;
    const payload = { func: "fail", args: [], id: "2" };
    await host.triggerMessage(payload);
    const call = host.postMessage.mock.calls[0][0];
    expect(call.id).toBe("2");
    expect(call.error).toBeDefined();
    expect(call.error.message).toBe("fail");
    expect(call.result).toBeUndefined();
  });

  it("should post error if function does not exist", async () => {
    const { initWorker } = await importInitWorker();
    const host = initWorker(functions) as unknown as MockHost;
    const payload = { func: "notfound", args: [], id: "3" };
    await host.triggerMessage(payload);
    const call = host.postMessage.mock.calls[0][0];
    expect(call.id).toBe("3");
    expect(call.error).toBeDefined();
    expect(call.error.message).toMatch(/not found/);
    expect(call.result).toBeUndefined();
  });
});
