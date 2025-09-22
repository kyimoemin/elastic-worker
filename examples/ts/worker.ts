import { registerWorker } from "elastic-worker";

export class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
  subtract(a: number, b: number) {
    return a - b;
  }

  fibonacci = (n: number): number => {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  };
}
const calculator = new Calculator();

registerWorker(calculator);
