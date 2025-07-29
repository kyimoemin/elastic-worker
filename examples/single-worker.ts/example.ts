import { DedicatedWorker } from "../../src/dedicated-worker";
import { Calculator } from "./worker";

const workerURL = new URL("./worker.ts", import.meta.url);

const num1 = 10;
const num2 = 5;

const workerProxy = new DedicatedWorker<Calculator>(workerURL);

const addition = await workerProxy.func("add")(num1, num2);
console.log(`Addition of ${num1} and ${num2} is:`, addition);

const subtraction = await workerProxy.func("subtract")(num1, num2);
console.log(`Subtraction of ${num1} and ${num2} is:`, subtraction);
