import { registerWorker, Transfer } from "elastic-worker";
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

/**
 * @typedef {{foo:string,buffer:ArrayBuffer}} TransferObject
 * @param {Transfer<TransferObject>} t
 * @returns
 */
const transfer = (t) => t;

const calculator = { add, subtract, fibonacci, transfer };

/**
 * @typedef {typeof calculator} CalculatorWorker
 */

registerWorker(calculator);
