import { TaskOverflowError } from "../errors";
import { Task, TaskStore } from "../types";

export class Queue implements TaskStore {
  private readonly items = new Map<number, Task>();
  private head: number = 0;
  private tail: number = 0;
  readonly maxSize: number;

  constructor(maxSize: number = Infinity) {
    this.maxSize = maxSize;
  }

  private checkOverflow() {
    if (this.items.size >= this.maxSize)
      throw new TaskOverflowError(this.maxSize);
  }
  private resetCounters() {
    if (this.count === 0) {
      this.head = 0;
      this.tail = 0;
    }
  }

  get count() {
    return this.items.size;
  }

  push = (item: Task) => {
    this.checkOverflow();
    this.items.set(this.tail++, item);
  };

  pull = (): Task | undefined => {
    const item = this.items.get(this.head);
    this.items.delete(this.head++);
    this.resetCounters();
    return item;
  };
  all = (): Iterable<Task> => {
    return this.items.values();
  };

  clear = () => {
    this.items.clear();
    this.resetCounters();
  };
}
