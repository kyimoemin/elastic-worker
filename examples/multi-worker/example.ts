import { ElasticWorker } from "async-multi-worker";
import { Calculator } from "./worker";

const workerURL = new URL("./worker.ts", import.meta.url);

const num1 = 10;
const num2 = 5;

const elasticWorker = new ElasticWorker<Calculator>(workerURL);

const addition = await elasticWorker.func("add");
console.log(`Addition of ${num1} and ${num2} is:`, addition(num1, num2));

const subtraction = await elasticWorker.func("subtract", 5000);
console.log(`Subtraction of ${num1} and ${num2} is:`, subtraction(num1, num2));
