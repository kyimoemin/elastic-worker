import { registerWorker } from "elastic-worker";
import { fibonacci } from "./fibonacci.js";

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

const calculator = { add, subtract, fibonacci };

registerWorker(calculator);
