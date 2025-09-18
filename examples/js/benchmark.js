import { ElasticWorker, DedicatedWorker } from "async-multi-worker";
import { fibonacci } from "./fibonacci.js";
const workerURL = new URL("./worker.js", import.meta.url);

const elasticWorker = new ElasticWorker(workerURL, {
  minWorkers: 4,
  maxWorkers: 8,
});
const dedicatedWorker = new DedicatedWorker(workerURL);

const FIBONACCI_NUM = 30;
const ITERATION = 100;
/**
 *
 * @param {number} n
 * @returns {number}
 */

/**
 *
 * @param {Function} fn
 */
async function loop(fn) {
  const start = performance.now();
  const promises = [];
  for (let i = 0; i < ITERATION; i++) {
    promises.push(fn());
  }
  await Promise.all(promises);
  return performance.now() - start;
}
/**
 *
 * @param {number[]} arr
 * @returns
 */
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 *
 * @param {Function} fn
 * @returns
 */
async function bench(fn) {
  const results = [];
  for (let i = 0; i < 30; i++) {
    results.push(await loop(fn));
  }
  return median(results);
}

async function main() {
  const mainThreadTime = await bench(() => fibonacci(FIBONACCI_NUM));
  console.log(`Main thread: ${mainThreadTime.toFixed(2)} ms`);
  const elasticWorkerTime = await bench(() =>
    elasticWorker.func("fibonacci")(FIBONACCI_NUM).catch(console.error)
  );
  console.log(`Elastic worker: ${elasticWorkerTime.toFixed(2)} ms`);
  const dedicatedWorkerTime = await bench(() =>
    dedicatedWorker.func("fibonacci")(FIBONACCI_NUM)
  );
  console.log(`Dedicated worker: ${dedicatedWorkerTime.toFixed(2)} ms`);
}

main();
