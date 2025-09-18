/**
 * @param obj - object to be wrapped in a read-only proxy
 * @returns a read-only proxy for an object.
 */
export function getReadonlyProxy<T extends Record<string, any>>(obj: T) {
  return new Proxy(obj, {
    get(target, prop) {
      if (["set", "delete", "clear"].includes(String(prop))) {
        throw new Error("This Map is read-only (proxy blocked).");
      }

      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? (value as any).bind(target) : value;
    },
    set() {
      throw new Error("This Map is read-only (cannot set properties).");
    },
    defineProperty() {
      throw new Error("This Map is read-only (cannot define properties).");
    },
    deleteProperty() {
      throw new Error("This Map is read-only (cannot delete properties).");
    },
  });
}
