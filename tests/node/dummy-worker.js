import { initWorker } from "../../dist/node/init-worker.js";

const add = (a, b) => a + b;

const subtract = (a, b) => a - b;

const calculator = { add, subtract };

initWorker(calculator);
