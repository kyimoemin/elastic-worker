import { vi } from "vitest";
class MockWorker {
  onmessage = null;
  onerror = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  constructor(stringUrl) {}
}

export function mockBrowserWorker() {
  Object.defineProperty(window, "Worker", {
    value: MockWorker,
    writable: true,
  });
}
