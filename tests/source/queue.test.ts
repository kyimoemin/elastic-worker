import { describe, it, expect } from "vitest";
import { Queue } from "../../src/utils/queue";

describe("Queue", () => {
  it("should enqueue and dequeue items in FIFO order", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    expect(queue.dequeue()).toBe(1);
    expect(queue.dequeue()).toBe(2);
    expect(queue.dequeue()).toBe(3);
  });

  it("should return undefined when dequeue is called on an empty queue", () => {
    const queue = new Queue<number>();
    expect(queue.dequeue()).toBeUndefined();
  });

  it("should report correct size", () => {
    const queue = new Queue<number>();
    expect(queue.size).toBe(0);
    queue.enqueue(1);
    expect(queue.size).toBe(1);
    queue.enqueue(2);
    expect(queue.size).toBe(2);
    queue.dequeue();
    expect(queue.size).toBe(1);
    queue.dequeue();
    expect(queue.size).toBe(0);
  });

  it("should clear the queue", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    queue.clear();
    expect(queue.size).toBe(0);
    expect(queue.dequeue()).toBeUndefined();
  });
});
