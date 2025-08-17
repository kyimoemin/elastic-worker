import { initWorker } from "../../src/init-worker";

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
