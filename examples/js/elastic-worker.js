import { ElasticWorker, Transfer } from "elastic-worker";

const workerURL = new URL("./worker.js", import.meta.url);

const num1 = 10;
const num2 = 5;

/**
 * @type {ElasticWorker<import("./worker").CalculatorWorker>}
 */
const elasticWorker = new ElasticWorker(workerURL);

const addition = elasticWorker.func("add");
console.log(`Addition of ${num1} and ${num2} is:`, await addition(num1, num2));

const subtraction = elasticWorker.func("subtract", { timeoutMs: 5000 });
console.log(
  `Subtraction of ${num1} and ${num2} is:`,
  await subtraction(num1, num2)
);

const transfer = elasticWorker.func("transfer");
const obj = { foo: "bar", buffer: new ArrayBuffer(8) };
const t = new Transfer(obj, [obj.buffer]);
const received = await transfer(t);
console.log("Received transfer object:", received.value);
