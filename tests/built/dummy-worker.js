import { registerWorker } from "elastic-worker";

const add = (a, b) => a + b;

const subtract = (a, b) => a - b;

const calculator = { add, subtract };

registerWorker(calculator);
