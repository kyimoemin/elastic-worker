import { initWorker } from "async-multi-worker";

export class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
  subtract(a: number, b: number) {
    return a - b;
  }
}
const calculator = new Calculator();

initWorker(calculator);
