# elastic-worker

![npm version](https://img.shields.io/npm/v/elastic-worker)
![npm downloads](https://img.shields.io/npm/dm/elastic-worker)
![license](https://img.shields.io/npm/l/elastic-worker)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [registerWorker](#registerworker)
- [ElasticWorker](#elasticworker)
- [Transfer](#transfer)
- [Errors](#errors)
- [Benchmark](#benchmark)
- [License](#license)

## Overview

`elastic-worker` provides a simple and unified abstraction over **Web Workers** (browser) and **Worker Threads** (Node.js).

It enables developers to run CPU-intensive or blocking tasks in worker threads **without manually handling worker setup, messaging, or lifecycle management**.

This package exports:

- [`registerWorker`](#registerworker) — register functions inside a worker context
- [`ElasticWorker`](#elasticworker) — scalable worker pool for parallel execution
- [`Transfer`](#transfer) - a class to use for passing transferable objects

## Installation

```bash
npm install elastic-worker
```

## Quick Start

Organize your project with a **separated worker file**:

```
src/
 worker.ts
 main.ts
```

> [!NOTE]  
> The examples are written in TypeScript to demonstrate type usage, but you can also use JavaScript.  
> Both JavaScript and TypeScript examples are provided in [examples](#examples).

#### 1. Define worker functions (`worker.ts`)

```ts
import { registerWorker } from "elastic-worker";

const add = (a: number, b: number) => a + b;
const sub = (a: number, b: number) => a - b;

const calc = { add, sub };

export type Calculator = typeof calc;

// Register functions for worker usage
registerWorker(calc);
```

#### 2. Use them from the main thread (`main.ts`)

```ts
import { ElasticWorker } from "elastic-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker<Calculator>(workerUrl);

const add = elasticWorker.func("add");
const subtract = elasticWorker.func("sub");

const addResult = await add(1, 2); // runs in worker
const subResult = await subtract(5, 3); // runs in worker
```

### Flow at a Glance

```
main.ts  →  ElasticWorker  →  worker.ts (your functions)
```

## registerWorker

Registers functions inside a worker context.

> [!CAUTION]  
> Functions and variables defined in the worker file where `registerWorker` is called **cannot** be directly imported into the main thread. If you need a function to be used directly by both threads, define it in a separate module and import it into the worker file.

```ts
registerWorker(functionsObject);
```

## ElasticWorker

An `ElasticWorker` can **scale horizontally** by spawning multiple workers.  
It is ideal for parallel, independent tasks (e.g., CPU-bound batch jobs).

### Constructor

```ts
new ElasticWorker(url, options);
```

- `url` — URL to the worker file
- `options` — configuration object (see below)

**Example (ESM):**

```ts
import { ElasticWorker } from "elastic-worker";

const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker(workerUrl, {
  minWorkers: 2,
  maxWorkers: 4,
  maxQueueSize: 1000,
  terminateIdleDelay: 1000,
});
```

**Example (CJS):**

```ts
const { ElasticWorker } = require("elastic-worker");
const { pathToFileURL } = require("url");
const path = require("path");

const workerUrl = pathToFileURL(path.resolve("./worker.js"));
const elasticWorker = new ElasticWorker(workerUrl);
```

### Options

- **minWorkers** (default: `1`) — Minimum idle workers to keep alive, prevents cold starts.
- **maxWorkers** (default: `4`) — Maximum worker instances allowed.
- **maxQueueSize** (default: `Infinity`) — Maximum tasks queued while workers are busy.
- **terminateIdleDelay** (default: `500` ms) — Idle timeout before terminating extra workers.

### Properties

- **pool** _(read-only)_ — Current worker pool.
- **queue** _(read-only)_ — Pending task queue.

### Methods

#### `func`

Creates a callable wrapper around a worker function.

```ts
const controller = new AbortController();

const add = elasticWorker.func("add", {
  timeoutMs: 10000,
  signal: controller.signal,
});
```

Parameters:

- `funcName` — Registered worker function name
- `options`:
  - `timeoutMs` (default: `5000`) — Call timeout
  - `signal` — [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for cancellation

#### `terminate`

Gracefully terminates all workers and clears the queue.  
Use this if you’re finished with the worker pool.

```ts
await elasticWorker.terminate();
```

## Transfer

The `Transfer` class provides a clean way to send [Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) between threads. Instead of passing a separate transfer list as a second parameter (like in `postMessage`), `Transfer` wraps both your data and its transferable references in a single object—keeping worker function signatures simple and consistent.

> [!NOTE]
> You don't need to use `Transfer` unless you are trying to transfer large data to worker thread.

### Usage

- To send a `Transferable Object` back from the worker, return a `Transfer` object with `Transferable Object` inside.
- Access the wrapped data via the `value` property of the `Transfer` instance.

### Rules

- All parameters must be wrapped inside a `Transfer` object.
- A worker function can accept **only one parameter**, and it must be a `Transfer` instance.

### Example

#### main.ts

```ts
const processLargeData = elasticWorker.func("processLargeData");

const largeData = new ArrayBuffer(8);
const t = new Transfer(largeData, [largeData]);

const result = await processLargeData(t);
console.log("result", result.value);
```

#### worker.ts

```ts
const processLargeData = (t: Transfer) => {
  const largeData = t.value;
  return new Transfer(largeData, [largeData]);
};

registerWorker({ processLargeData });
```

### Constructor

The `Transfer` constructor takes two parameters:

1. **value** — Any data you want to send (can include `Transferable` objects).
2. **transferList** — An array of `Transferable` objects that should be transferred, similar to the second argument in `postMessage`.

```ts
const buffer1 = new ArrayBuffer(8);
const buffer2 = new ArrayBuffer(16);

const transfer = new Transfer(
  { buffer1, buffer2, num: 1, str: "hello world" },
  [buffer1, buffer2]
);
```

### Properties

- **`value`** — The data being transferred between the main and worker threads.

## Errors

- **TimeoutError** — Worker call exceeded timeout
- **QueueOverflowError** — Task queue limit reached
- **AbortedError** — Worker call was cancelled
- **WorkerTerminatedError** — Worker was terminated
- **FunctionNotFoundError** — Function not registered in worker

### Benchmark: Main Thread vs ElasticWorker (Fibonacci Example)

```log

Main thread:              596.17 ms
Elastic worker(4 worker): 156.19 ms (~3.82 x faster)
```

The benchmark results can vary significantly based on the number of worker threads (`maxWorker`) and the computational intensity of the task.

- For **CPU-intensive tasks** (like Fibonacci or large data processing), increasing `maxWorker` generally provides near-linear performance gains — e.g., `maxWorker: 2` ≈ 2× faster, `maxWorker: 4` ≈ 4× faster.
- For **lightweight or I/O-bound tasks**, scaling may be less efficient — even with `maxWorker: 8`, the speedup might be closer to ~5× depending on how much real computation is involved.

See [examples/js/benchmark.js](./examples/js/benchmark.js) try it yourself.

## Examples

Here are [javascript](./examples/js/elastic-worker.js) and [typescript](./examples/ts/elastic-worker.ts) examples.

## License

MIT
