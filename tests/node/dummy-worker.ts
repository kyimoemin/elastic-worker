import { initWorker } from "../../dist/node/init-worker";

const add = (a, b) => a + b;

const subtract = (a, b) => a - b;

const calculator = { add, subtract };

export type Calculator = typeof calculator;

initWorker(calculator);
