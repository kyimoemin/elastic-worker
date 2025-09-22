import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mockHost = {
  postMessage: vi.fn(),
  onmessage: vi.fn(),
  triggerMessage: (data: any) => {
    return mockHost.onmessage?.(data);
  },
};

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
      Host: vi.fn().mockImplementation(() => mockHost),
    };
  });

  functions = {
    add: vi.fn((a, b) => a + b),
    fail: vi.fn(() => {
      throw new Error("fail");
    }),
  };
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

let functions;

async function importRegisterWorker() {
  return import("../../src/register-worker");
}

describe("registerWorker", () => {
  it("should call the correct function and post result", async () => {
    const { registerWorker } = await importRegisterWorker();
    registerWorker(functions);
    const payload = { func: "add", args: [2, 3], id: "1" };
    await mockHost.triggerMessage(payload);
    expect(functions.add).toHaveBeenCalledWith(2, 3);
    expect(mockHost.postMessage).toHaveBeenCalledWith({
      id: "1",
      result: 5,
    });
  });

  it("should post error if function throws", async () => {
    const { registerWorker } = await importRegisterWorker();
    registerWorker(functions);
    const payload = { func: "fail", args: [], id: "2" };
    await mockHost.triggerMessage(payload);
    const call = mockHost.postMessage.mock.calls[0][0];
    expect(call.id).toBe("2");
    expect(call.error).toBeDefined();
    expect(call.error.message).toBe("fail");
    expect(call.result).toBeUndefined();
  });

  it("should post error if function does not exist", async () => {
    const { registerWorker } = await importRegisterWorker();
    registerWorker(functions);
    const payload = { func: "notfound", args: [], id: "3" };
    await mockHost.triggerMessage(payload);
    const call = mockHost.postMessage.mock.calls[0][0];
    expect(call.id).toBe("3");
    expect(call.error).toBeDefined();
    expect(call.error.message).toBe("Function 'notfound' not found in worker.");
    expect(call.result).toBeUndefined();
  });
});
