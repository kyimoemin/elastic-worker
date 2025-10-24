import { describe, it, expect } from "vitest";
import { getReadonlyProxy } from "../../src/utils/readonly-proxy";

describe("getReadonlyProxy", () => {
  it("should return a proxy that blocks set", () => {
    const obj = { a: 1 };
    const proxy = getReadonlyProxy(obj);
    expect(() => {
      // @ts-ignore
      proxy.a = 2;
    }).toThrow("read-only");
  });

  it("should block defineProperty", () => {
    const obj = { a: 1 };
    const proxy = getReadonlyProxy(obj);
    expect(() => {
      Object.defineProperty(proxy, "b", { value: 2 });
    }).toThrow("read-only");
  });

  it("should block deleteProperty", () => {
    const obj = { a: 1 };
    const proxy = getReadonlyProxy(obj);
    expect(() => {
      // @ts-ignore
      delete proxy.a;
    }).toThrow("read-only");
  });

  it("should block methods named set, delete, clear", () => {
    const obj = {
      set() {},
      delete() {},
      clear() {},
    };
    const proxy = getReadonlyProxy(obj);
    expect(() => proxy.set()).toThrow("read-only");
    expect(() => proxy.delete()).toThrow("read-only");
    expect(() => proxy.clear()).toThrow("read-only");
  });

  it("should allow reading properties and calling other methods", () => {
    const obj = {
      a: 1,
      getA() { return this.a; },
    };
    const proxy = getReadonlyProxy(obj);
    expect(proxy.a).toBe(1);
    expect(proxy.getA()).toBe(1);
  });
});
