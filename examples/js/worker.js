import { initWorker } from "async-multi-worker";

/**
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const add = (a, b) => a + b;
/**
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const subtract = (a, b) => a - b;

/**
 *
 * @param {number} n
 * @returns {number}
 */
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

const calculator = { add, subtract, fibonacci };

initWorker(calculator);
