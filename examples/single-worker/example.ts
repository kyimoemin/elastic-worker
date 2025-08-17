import { DedicatedWorker } from "../../src/dedicated-worker";
import { Calculator } from "./worker";

const workerURL = new URL("./worker.ts", import.meta.url);

const num1 = 10;
const num2 = 5;

const workerProxy = new DedicatedWorker<Calculator>(workerURL);

const addition = await workerProxy.func("add");
console.log(`Addition of ${num1} and ${num2} is:`, addition(num1, num2));

const subtraction = await workerProxy.func("subtract");
console.log(`Subtraction of ${num1} and ${num2} is:`, subtraction(num1, num2));
