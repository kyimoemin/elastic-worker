import { ElasticWorker } from "elastic-worker";
import { Calculator } from "./worker";

const workerURL = new URL("./worker.ts", import.meta.url);

const num1 = 10;
const num2 = 5;

const elasticWorker = new ElasticWorker<Calculator>(workerURL);

const addition = elasticWorker.func("add");
console.log(`Addition of ${num1} and ${num2} is:`, await addition(num1, num2));

const subtraction = elasticWorker.func("subtract", { timeoutMs: 1000 });
console.log(
  `Subtraction of ${num1} and ${num2} is:`,
  await subtraction(num1, num2)
);
