import { initWorker } from "async-multi-worker";

const add = (a, b) => a + b;

const subtract = (a, b) => a - b;

const error = (a, b) => {
  throw new Error("fail");
};

const calculator = { add, subtract, error };

initWorker(calculator);
