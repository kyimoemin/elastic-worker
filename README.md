# async-multi-worker

![npm version](https://img.shields.io/npm/v/async-multi-worker)
![npm downloads](https://img.shields.io/npm/dm/async-multi-worker)
![license](https://img.shields.io/npm/l/async-multi-worker)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [initWorker](#initworker)
- [ElasticWorker](#elasticworker)
- [DedicatedWorker](#dedicatedworker)
- [Errors](#errors)
- [Benchmark](#benchmark)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

`async-multi-worker` provides a simple abstraction over **Web Workers** (browser) and **Worker Threads** (Node.js).

It allows you to offload CPU-intensive or blocking tasks to workers **without manually handling worker setup, messaging, or lifecycle management**.

This package exports:

- [`initWorker`](#initworker) — to register worker functions
- [`ElasticWorker`](#elasticworker) — scalable worker pool for parallel tasks
- [`DedicatedWorker`](#dedicatedworker) — single persistent worker

---

## Installation

```bash
npm install async-multi-worker
```

---

## Quick Start

Organize your project with a dedicated worker file:

```
src/
	worker.ts
	main.ts
```

### 1. Define worker functions (`worker.ts`)

```ts
import { initWorker } from "async-multi-worker";

const add = (a: number, b: number) => a + b;
const sub = (a: number, b: number) => a - b;

const calc = { add, sub };

export type Calculator = typeof calc;

// Register worker functions
initWorker(calc);
```

### 2. Use them from main thread (`main.ts`)

```ts
import { ElasticWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker<Calculator>(workerUrl);

const add = elasticWorker.func("add");
const subtract = elasticWorker.func("sub");

const addResult = await add(1, 2); // runs in worker
const subResult = await subtract(5, 3); // runs in worker
```

### Flow (at a glance)

```
main.ts → ElasticWorker / DedicatedWorker → worker.ts (your functions)
```

---

## initWorker

Registers functions to be executed inside a worker context.

> [!CAUTION]  
> Functions and variables defined in the worker file where `initWorker` is called **cannot** be directly exported to the main thread.

```ts
initWorker(functionsObject);
```

---

## ElasticWorker

An `ElasticWorker` can **spawn multiple workers on demand**, making it ideal for parallel tasks.

### Constructor

```ts
new ElasticWorker(url, options);
```

- `url` — URL of the worker file
- `options` — configuration object

Example (ESM):

```ts
const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker(workerUrl, {
  minWorkers: 2,
  maxWorkers: 4,
  maxQueueSize: 1000,
  terminateIdleDelay: 1000,
});
```

Example (CJS):

```ts
import path from "path";
import { pathToFileURL } from "url";

const workerUrl = pathToFileURL(path.resolve("./worker.js"));
const elasticWorker = new ElasticWorker(workerUrl);
```

---

### Options

- **minWorkers** (default: `1`) — Minimum idle workers kept alive. Prevents cold starts stays ready for upcoming calls.
- **maxWorkers** (default: `4`) — Maximum active workers. Prevents unlimited worker spawns.
- **maxQueueSize** (default: `Infinity`) — Max tasks allowed in queue if workers are busy.
- **terminateIdleDelay** (default: `500` ms) — Delay before terminating idle workers beyond `minWorkers`.

---

### Properties

- **pool** (read only) — Active workers pool.
- **queue** (read only) — Pending task queue.

---

### Methods

#### `func`

Creates a callable function bound to a worker function.

```ts
const controller = new AbortController();

const add = elasticWorker.func("add", {
  timeoutMs: 10000,
  signal: controller.signal,
});
```

Parameters:

- `funcName` — Name of the worker function.
- `options`:
  - `timeoutMs` (default: `5000`) — Timeout in ms.
  - `signal` — [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).

---

#### `terminate`

Terminates all workers and clears the queue.  
Use only if you are sure no further tasks are needed.

```ts
await elasticWorker.terminate();
```

---

## DedicatedWorker

A `DedicatedWorker` runs in a **single worker thread**.
It can maintain **state** since it is using single worker thead, but the state can be lost if that worker is crashed or terminated. I recommend to use **ElasticWorker** with managing state in main thread.

### Constructor

```ts
new DedicatedWorker(url, options);
```

- `url` — URL of the worker file
- `options`:
  - `maxQueueSize` (default: `Infinity`) — Max tasks allowed in queue if worker is busy.

Example

```ts
const workerUrl = new URL("./worker.ts", import.meta.url);
const dedicatedWorker = new DedicatedWorker(workerUrl, {
  maxQueueSize: 1000,
});
```

### Properties

- **busy** (read only) — Indicates worker is executing a task
- **queue** (read only) — Pending task queue.
- **isTerminated** (read only) — Worker is terminated or not

- **busy** —

### Methods

#### `func`

Creates a callable function bound to a worker function.

```ts
const add = elasticWorker.func("add");
```

Parameters:

- `funcName` — Name of the worker function

#### `terminate`

Terminates worker and clears the queue.
Use only if you are sure no further tasks are needed.

```ts
await dedicatedWorker.terminate();
```

#### `respawn`

Respawn the terminated worker.

```ts
dedicatedWorker.respawn();
```

### Example

**worker.ts**

```ts
import { initWorker } from "async-multi-worker";

// export this class so it can be imported as a type in main.ts
export class Calculator {
  result: number;

  add = (a, b) => {
    this.result = a + b;
    return this.result;
  };
  sub = (a, b) => {
    this.result = a - b;
    return this.result;
  };
  lastResult = () => this.result;
}

const calculator = new Calculator();

initWorker(calculator);
```

In this example, we store the last calculation result in the `result` variable. You can retrieve this in the main thread using the `lastResult` function.

**main.ts**

```ts
import { DedicatedWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const dedicatedWorker = new DedicatedWorker(workerUrl);

const add = dedicatedWorker.func("add");
const lastResult = dedicatedWorker.func("lastResult");

await add(10, 20);
console.log(await lastResult()); // 30
```

---

## Errors

**TimeoutError** — a worker call has been timed out
**QueueOverflowError** — Max queue limit reached
**AbortedError** — a worker call has been aborted
**WorkerTerminatedError** — worker has been terminated
**FunctionNotFoundError** — given function is not registered in worker functions

---

## Benchmark

Here is the comparison of main thread, ElasticWorker and DedicatedWorker.
You can see the how I do the comparison in `examples/js/benchmark.js` file of the GitHub repo.
As you see `DedicatedWorker` is about the same speed even a bit slower coz it has other overhead.
The main thing that `DedicatedWorker` help here is unblock the main thread.

```log
Main thread: 597.24 ms
Elastic worker: 81.62 ms
Dedicated worker: 605.02 ms
```

- **Elastic vs Main**: 597.24 / 81.62 ≈ 7.32× faster
- **Dedicated vs Main**: 605.02 / 597.24 ≈ 1.3% slower

---

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch
3. Run tests with `npm test`
4. Open a Pull Request

---

## License

MIT
