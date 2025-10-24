import { registerWorker } from "elastic-worker";

const add = (a, b) => a + b;

const subtract = (a, b) => a - b;

const transfer = (buffer) => buffer;

const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

const error = (a, b) => {
  throw new Error("fail");
};

const calculator = { add, subtract, error, fibonacci, transfer };

registerWorker(calculator);
