import { DedicatedWorker } from "async-multi-worker";
import { Calculator } from "./worker";

const workerURL = new URL("./worker.ts", import.meta.url);

const num1 = 10;
const num2 = 5;

const dedicatedWorker = new DedicatedWorker<Calculator>(workerURL);

const addition = await dedicatedWorker.func("add");
console.log(`Addition of ${num1} and ${num2} is:`, addition(num1, num2));

const subtraction = await dedicatedWorker.func("subtract");
console.log(`Subtraction of ${num1} and ${num2} is:`, subtraction(num1, num2));
