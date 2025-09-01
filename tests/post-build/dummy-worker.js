import { initWorker } from "async-multi-worker";

const add = (a, b) => a + b;

const subtract = (a, b) => a - b;

const calculator = { add, subtract };

initWorker(calculator);
