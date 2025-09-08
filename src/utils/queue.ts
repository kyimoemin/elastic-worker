import { QueueOverflowError } from "../errors";

export class Queue<T> {
  private items = new Map<number, T>();
  private head: number = 0;
  private tail: number = 0;

  readonly maxSize: number;

  constructor(maxSize: number = Infinity) {
    this.maxSize = maxSize;
  }

  private checkOverflow() {
    if (this.items.size >= this.maxSize)
      throw new QueueOverflowError(this.maxSize);
  }
  private resetCounters() {
    if (this.isEmpty()) {
      this.head = 0;
      this.tail = 0;
    }
  }

  enqueue = (item: T) => {
    this.checkOverflow();
    this.items.set(this.tail++, item);
  };

  dequeue = (): T | undefined => {
    const item = this.items.get(this.head);
    this.items.delete(this.head++);
    this.resetCounters();
    return item;
  };

  peek = (): T | undefined => {
    return this.items.get(this.head);
  };

  isEmpty = () => {
    return this.items.size === 0;
  };
}
