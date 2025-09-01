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

const calculator = { add, subtract };

initWorker(calculator);
