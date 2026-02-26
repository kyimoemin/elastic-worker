import { describe, it, expect } from "vitest";
import { Queue } from "../../src/utils/queue";

describe("Queue", () => {
  const makeTask = (id: string) => ({
    resolve: () => {},
    reject: () => {},
    func: "noop",
    id,
    args: [],
    timeout: 0,
  });

  it("should push and pull items in FIFO order", () => {
    const queue = new Queue();
    const task1 = makeTask("1");
    const task2 = makeTask("2");
    const task3 = makeTask("3");
    queue.push(task1);
    queue.push(task2);
    queue.push(task3);
    expect(queue.pull()).toBe(task1);
    expect(queue.pull()).toBe(task2);
    expect(queue.pull()).toBe(task3);
  });

  it("should return undefined when pull is called on an empty queue", () => {
    const queue = new Queue();
    expect(queue.pull()).toBeUndefined();
  });

  it("should report correct size", () => {
    const queue = new Queue();
    expect(queue.count).toBe(0);
    queue.push(makeTask("1"));
    expect(queue.count).toBe(1);
    queue.push(makeTask("2"));
    expect(queue.count).toBe(2);
    queue.pull();
    expect(queue.count).toBe(1);
    queue.pull();
    expect(queue.count).toBe(0);
  });

  it("should clear the queue", () => {
    const queue = new Queue();
    queue.push(makeTask("1"));
    queue.push(makeTask("2"));
    queue.clear();
    expect(queue.count).toBe(0);
    expect(queue.pull()).toBeUndefined();
  });
});
