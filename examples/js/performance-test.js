import { ElasticWorker, DedicatedWorker } from "async-multi-worker";
const workerURL = new URL("./worker.js", import.meta.url);

const elasticWorker = new ElasticWorker(workerURL, {
  minWorkers: 4,
  maxWorkers: 8,
});
const dedicatedWorker = new DedicatedWorker(workerURL);

const FIBONACCI_NUM = 30;
const count = 100;
/**
 *
 * @param {number} n
 * @returns {number}
 */
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

function testMainThread() {
  const results = [];
  console.time(`${FIBONACCI_NUM} fibonacci ${count} times Main Thread`);
  for (let i = 0; i < count; i++) {
    results.push(fibonacci(FIBONACCI_NUM));
  }
  console.timeEnd(`${FIBONACCI_NUM} fibonacci ${count} times Main Thread`);
}

async function testElasticWorker() {
  const fibonacciFunc = elasticWorker.func("fibonacci", { timeoutMs: 1000 });
  console.time(`${FIBONACCI_NUM} fibonacci ${count} times Elastic Worker`);
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(fibonacciFunc(FIBONACCI_NUM));
  }
  await Promise.all(promises);
  console.timeEnd(`${FIBONACCI_NUM} fibonacci ${count} times Elastic Worker`);
  await elasticWorker.terminate();
}

async function testDedicatedWorker() {
  const fibonacciFunc = dedicatedWorker.func("fibonacci");
  console.time(`${FIBONACCI_NUM} fibonacci ${count} times Dedicated Worker`);
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(fibonacciFunc(FIBONACCI_NUM));
  }
  await Promise.all(promises);
  console.timeEnd(`${FIBONACCI_NUM} fibonacci ${count} times Dedicated Worker`);
  await dedicatedWorker.terminate();
}

async function runTests() {
  await testMainThread();
  await testElasticWorker();
  await testDedicatedWorker();
}

runTests();
